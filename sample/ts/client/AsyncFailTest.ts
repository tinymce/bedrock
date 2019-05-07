import * as UnitTest from '../../../src/client/ts/api/UnitTest';

UnitTest.asynctest('AsyncFail Test', (success, failure) => {

  new Promise(function (resolve, reject) {
    setTimeout(function () {
      failure('failed');
    }, 1000);
  }).then(success);
});