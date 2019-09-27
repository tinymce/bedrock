import * as UnitTest from '../../../modules/client/src/main/ts/api/UnitTest';

UnitTest.asynctest('Clipboard Test', (success, failure) => {

  if (window.fetch === undefined) return failure('This sample only runs on Chrome');

  var importClipboard = function (fileName) {
    return fetch('/clipboard', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        import: fileName
      })
    });
  };

  var pasteInto = function (elm) {
    return fetch('/keys', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keys: [
          {combo: {ctrlKey: true, key: 'v'}}
        ],
        selector: '#' + elm.id
      })
    });
  };

  var assert = function () {
    return new Promise(function (done) {
      setTimeout(function() {
        alert(body.innerHTML);
        done();
      }, 1000);
    });
  };

  var body = document.createElement('div');
  body.id = 'test';
  body.contentEditable = 'true';
  document.body.appendChild(body);

  importClipboard('word.zip')
    .then(pasteInto(body) as any)
    .then(assert)
    .then(function() {
      success();
    })
    .catch(function(ex) {
      console.log('parsing failed', ex);
    });
});
