import { UnitTest } from '@ephox/bedrock-client';

import { post, sendKeyCombo } from '../utils/Utils';

UnitTest.asynctest('Clipboard Test', (success, failure) => {
  const importClipboard = function (fileName: string) {
    return post('/clipboard', { import: fileName });
  };

  const pasteInto = function (elm) {
    return sendKeyCombo('#' + elm.id, 'v', { ctrlKey: true });
  };

  const assert = function () {
    return new Promise<void>(function (done) {
      setTimeout(function () {
        alert(body.innerHTML);
        done();
      }, 1000);
    });
  };

  const body = document.createElement('div');
  body.id = 'test';
  body.contentEditable = 'true';
  document.body.appendChild(body);

  importClipboard('word.zip')
    .then(pasteInto(body) as any)
    .then(assert)
    .then(function () {
      success();
    })
    .catch(function (ex) {
      console.log('parsing failed', ex);
      failure(ex);
    });
});
