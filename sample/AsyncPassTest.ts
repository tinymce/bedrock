import * as UnitTest from '../src/client/ts/api/UnitTest';

declare let assert;

UnitTest.asynctest('AsyncPass Test', (success, failure) => {

  new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 1000);
  }).then(success);
});