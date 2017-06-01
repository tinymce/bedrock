asynctest(
  'AsyncPassTest',

  [

  ],

  function () {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];

    new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve();
      }, 1000);
    }).then(success);
  }
);