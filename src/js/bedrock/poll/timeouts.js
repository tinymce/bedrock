var timeoutExit = function (limit, s) {
  var start = s;

  var hasExpired = function (current) {
    return (current - start) >= limit;
  };

  var reset = function (current) {
    start = current;
  };

  var diff = function (current) {
    return current - start;
  };

  var getLimit = function () {
    return limit;
  };

  return {
    hasExpired: hasExpired,
    reset: reset,
    diff: diff,
    getLimit: getLimit
  };
};

module.exports = {
  timeoutExit: timeoutExit
};
