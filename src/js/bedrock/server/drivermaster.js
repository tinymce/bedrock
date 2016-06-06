var waiter = require('../util/waiter.js');

var create = function () {

  var inUse = false;

  var queue = [ ];


  // If the queue is empty and we are not "In Use", then this can lock.


  var doWaitForIdle = function (identifier, f, label, attempts) {
    if (attempts === 0) return use(f, label);
    if (inUse === false && queue.length === 0) return use(f, label);
    else if (inUse === false && queue[0].identifier === identifier) {
      var first = queue[0];
      queue = queue.slice(1);
      return use(first.f, first.label);
    } else {
      return waiter.delay({}, 100).then(function () {
        return doWaitForIdle(identifier, f, label, attempts - 1);
      });
    }
  };

  // Probably just give up after a while ... or I'll hit a deadlock.
  var waitForIdle = function (f, label) {
    if (inUse === false && queue.length === 0) return use(f, label);
    else {
      var identifier = label + '_' + new Date().getTime() + Math.floor(Math.random() * 10000);
      queue = queue.concat({
        f: f,
        label: label,
        identifier: identifier
      });
      return doWaitForIdle(identifier, f, label, 100);
    }
  };


  var use = function (f, label) {
    console.log('LOCKING', label);
    inUse = true;

    return f().then(function (v) {
      console.log('UNLOCKING (SUCCESS)', label);
      inUse = false;
      return v;
    }, function (err) {
      inUse = false;
      console.log('UNLOCKING (FAILURE): ', err, label);
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