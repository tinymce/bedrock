import * as Suite from './Suite';

Suite.asynctest('AsyncFailTest', function (success, failure) {
  setTimeout(function () {
    failure('Failed');
  }, 2000);
});
