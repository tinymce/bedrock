import * as Suite from './Suite';

Suite.asynctest('AsyncPassTest', function (success, failure) {
  new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 1000);
  }).then(function () {
    success();
  });
});
