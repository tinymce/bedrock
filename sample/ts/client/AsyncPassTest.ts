import * as UnitTest from '../../../modules/client/src/main/ts/api/UnitTest';

UnitTest.asynctest('AsyncPass Test', (success, failure) => {

  new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 1000);
  }).then(success);
});
