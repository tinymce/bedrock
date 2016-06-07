  var delay = function (value, amount) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(value);
      }, amount);
    });
  };

  module.exports = {
    delay: delay
  };