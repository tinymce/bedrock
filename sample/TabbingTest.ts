import * as UnitTest from '../src/client/ts/api/UnitTest';

import * as assert from '../src/client/ts/api/LegacyAssert';

UnitTest.asynctest('Tabbing Test', (success, failure) => {
  var input1 = document.createElement('input');
  input1.classList.add('input-1');

  var input2 = document.createElement('input');
  input2.classList.add('input-2');

  document.body.appendChild(input1);
  document.body.appendChild(input2);

  input1.focus();

  // Dupe with IFrameTest.ts
  var post = function (url, data, onSuccess, onFailure) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.onload = function () {
      try {
        onSuccess();
      } catch (err) {
        onFailure(err);
      }
    };

    request.onerror = function (err) {
      debugger;
      console.error(err);
      onFailure();
    };

    request.send(JSON.stringify(data));
  };


  var sendText = function (selector, keys, onSuccess, onFailure) {
    post('/keys', { selector: selector, keys: keys }, () => {
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, onFailure);
  };

  setTimeout(() => {
    assert.eq(true, document.activeElement === input1, 'Checking focus initially on first input');
    sendText('.input-1', [{
      text: '\u0009'
    }], function () {
      assert.eq(true, document.activeElement === input2, 'Checking focus now on second input');
      sendText('.input-2', [{
        combo: {
          ctrlKey: false,
          shiftKey: true,
          metaKey: false,
          altKey: false,
          key: '\u0009'
        }
      }], function () {
        assert.eq(true, document.activeElement === input1, 'Checking focus back on first input');
        document.body.removeChild(input1);
        document.body.removeChild(input2);
        success();
      }, failure)
    }, failure);
  }, 1000);
});