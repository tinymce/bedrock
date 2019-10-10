import { UnitTest } from '@ephox/bedrock-client'

UnitTest.asynctest('AsyncFail Test', (success, failure) => {

  new Promise(function (resolve, reject) {
    setTimeout(function () {
      failure('failed');
    }, 1000);
  }).then(success);
});
