import { UnitTest, assert } from '@ephox/bedrock-client';

UnitTest.asyncTest('Tabbing Test', (success, failure) => {
  const input1 = document.createElement('input');
  input1.classList.add('input-1');

  const input2 = document.createElement('input');
  input2.classList.add('input-2');

  document.body.appendChild(input1);
  document.body.appendChild(input2);

  input1.focus();

  // Dupe with IFramePassTest.ts
  const post = function (url: string, data: any, onSuccess: () => void, onFailure: (err?: Error) => void) {
    const request = new XMLHttpRequest();
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

  const sendText = function (selector, keys, onSuccess, onFailure) {
    post('/keys', { selector, keys }, () => {
      setTimeout(() => {
        try {
          onSuccess();
        } catch (err) {
          onFailure(err);
        }
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
      }, failure);
    }, failure);
  }, 1000);
});
