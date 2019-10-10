import * as UnitTest from '../../../modules/client/src/main/ts/api/UnitTest';

UnitTest.asynctest('AsyncFail Test', (success, failure) => {

  new Promise(function (resolve, reject) {
    setTimeout(function () {
      failure('failed');
    }, 1000);
  }).then(success);
});
