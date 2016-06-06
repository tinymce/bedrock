var create = function () {

  // so many problems ....
  var inUse = false;

  var delay = function (v, amount) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(v);
      }, amount);
    });
  };

  var queue = [ ];

  // Simple scenarios:
  // No items on queue
  // waitForIdle comes in
  // We should be idle
  // we can just return the promise invocation: f

  // One item on queue
  // waitForIdle comes in
  // We are not idle
  // We can return (waitForQueue to be empty) >>= f

  // Now, is this going to work? Is it going to make previous error states
  // in queues throw error values through an entirely unrelated f; I'll check
  // in Chrome.

  // So how does the queue work. Does it store the currently executing one ... or is
  // the currently executing one removed when it started executing ?

  // Starts Loop
  // Empty queue so just runs the loop.f
  // Gets a request for keys.f
  // Put keys.f into the queue and make waitForIdle wait until it has returned (that's difficult) ... so
  // waitForIdle needs to be able to waitForQueue which is either a noop, or the currently executing one +
  // all the others.

  // I think at the very least, I'm going to need a currently executing function.

  var currentf = null;

  var waitForQueue = function () {
    if (queue.length === 0 && currentf === null) {
      console.log('Nothing in queue');
      return Promise.resolve({});
    }
    else if (queue.length === 0) {
      console.log('Nothing in queue but a current f');
      return currentf;
    }
    else if (currentf !== null) {
      return currentf.then(function () {
        currentf = null;
        console.log('clear the current f after successful invocation of currentf');
        return waitForQueue();
      }, function () {
        currentf = null;
        console.log('clear the current f after failed invocation of currentf');
        return waitForQueue();
      });
    } else {
      currentf = pop().f();
      console.log('Run currentf and then wait for rest of queue');
      return waitForQueue();
    }
  };


  // Probably just give up after a while ... or I'll hit a deadlock.
  var waitForIdle = function (f, label) {
    console.log('ATTEMPTING LOCK:', label);
    if (inUse === false && queue.length === 0) {
      console.log('Allowing lock because queue empty and idle');
      return use(f, label);
    } else if (inUse === false && queue[0].label === label) {
      console.log(label, 'This is the first thing in the queue, so allow lock');
      queue = queue.slice(0);
      return use(f, label);
    } else {
      console.log(label, 'Queueing ... not a priority');
      if (! queue.find(function (q) {
        return q.label === label;
      })) {
        queue = queue.concat({ f: f, label: label });
      }
      console.log(label, 'IN USE ... retrying in 1 second');
      return delay({}, 1000).then(function () {

        console.log('queue', queue);
        return waitForIdle(f, label);
      });
    }
  };

  var waitForIdle2 = function (f, label) {
    queue.push({f: f, label: label });
    return waitForQueue().then(function () {
      console.log('Ready for', label, queue);
      return f().then(function () {
        console.log('Finished with', label);
      });
    }, function () {
      return f();
    });
  };


  var pop = function () {
    if (queue.length === 0) return null;
    else {
      var first = queue[0];
      queue = queue.slice(1);
      return first;
    }
  };

  var use = function (f, label) {
    console.log('LOCKING', label);
    var oldInUse = inUse;
    inUse = true;

    currentf = f();
    return currentf.then(function (v) {
      console.log('UNLOCKING (SUCCESS)', label, oldInUse);
      inUse = false;
      currentf = null;
      return v;
    }, function (err) {
      inUse = false;
      currentf = null;
      console.log('UNLOCKING (FAILURE): ', err, label, oldInUse);
      return err;
    });
  };

  return {
    waitForIdle: waitForIdle
  };
};

module.exports = {
  create: create
};