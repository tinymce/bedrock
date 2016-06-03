var create = function () {

  // so many problems ....
  var inUse = false;

  var delay = function (v, amount) {
    return Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(v);
      }, amount);
    });
  };
  
  var queue = [ ];
  
  // Probably just give up after a while ... or I'll hit a deadlock.
  var waitForIdle = function (f, label) {
    console.log('ATTEMPTING LOCK:', label);
    if (inUse === false) {
      return use(f, label);
    } else {
      console.log(label, 'IN USE ... retrying in 1 second');
      return delay({}, 1000).then(function () {
        console.log('retrying', inUse);
        return waitForIdle(f, label + '+');
      });
    }
  };
  
  var use = function (f, label) {
    console.log('LOCKING', label);
    var oldInUse = inUse;
    inUse = true;
    return f().then(function (v) {
      console.log('UNLOCKING (SUCCESS)', label, oldInUse);
      inUse = oldInUse;
      return v;
    }, function (err) {
      inUse = oldInUse;   
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
}