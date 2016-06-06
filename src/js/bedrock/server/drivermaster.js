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


  var use = function (f, label) {
    console.log('LOCKING', label);
    var oldInUse = inUse;
    inUse = true;

    return f().then(function (v) {
      console.log('UNLOCKING (SUCCESS)', label, oldInUse);
      inUse = false;
      return v;
    }, function (err) {
      inUse = false;
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