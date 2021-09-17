import { UnitTest, assert } from '@ephox/bedrock-client';

UnitTest.asyncTest('IFrame Test', (success, failure) => {

  /*
    * This frame will get sent keyboard events to its content editable body
    */
  const iframe1 = document.createElement('iframe');
  iframe1.setAttribute('class', 'iframe-keyboard');

  /*
    * This textarea will get sent keyboard events
    */
  const textarea = document.createElement('textarea');

  /*
    * This frame will get sent mouse events to its select inside
    */
  const iframe2 = document.createElement('iframe');
  iframe2.setAttribute('class', 'iframe-mouse');

  /*
    * This button will get sent mouse events
    */
  const button = document.createElement('button');
  button.innerHTML = 'Click me';
  button.setAttribute('class', 'button-mouse');
  button.addEventListener('click', function () {
    button.style.setProperty('background', '#cadbee');
    button.setAttribute('data-clicked', 'clicked');
  });

  const post = function (url, data, onSuccess, onFailure) {
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

  const sendText = function (selector, text, onSuccess, onFailure) {
    post('/keys', { selector, keys: [ { text } ] }, onSuccess, onFailure);
  };

  const sendMouse = function (selector, type, onSuccess, onFailure) {
    post('/mouse', { selector, type }, onSuccess, onFailure);
  };

  const loadContentIntoFrame = function (fr, content, onSuccess, onFailure) {
    const listener = function () {
      fr.removeEventListener('load', listener);
      try {
        const doc = fr.contentWindow.document;
        doc.open('text/html', 'replace');
        doc.writeln(content);
        doc.close();
      } catch (err) {
        onFailure(err);
      }

      onSuccess(fr);
    };

    fr.addEventListener('load', listener);
  };

  // Give IE a bit of lead in time.
  setTimeout(function () {

    loadContentIntoFrame(iframe1, '<! doctype><html><body contenteditable="true">!</body></html>', function (fr1) {
      loadContentIntoFrame(iframe2, '<! doctype><html><body><input id="chk" type="checkbox"><label for="chk">Check me</label></body></html>', function (fr2) {

        // IE requires focus.
        fr1.contentWindow.document.body.focus();

        sendText('.iframe-keyboard=>body', 'going', function () {
          sendText('textarea', 'blah', function () {
            assert.eq('going!', fr1.contentWindow.document.body.innerHTML.trim());
            assert.eq('blah', textarea.value);

            sendMouse('.iframe-mouse=>input', 'click', function () {
              assert.eq(true, fr2.contentWindow.document.body.querySelector('input').checked);
              sendMouse('.button-mouse', 'click', function () {
                assert.eq('clicked', button.getAttribute('data-clicked'));

                document.body.removeChild(fr1);
                document.body.removeChild(fr2);
                document.body.removeChild(textarea);
                document.body.removeChild(button);

                success();
              }, failure);
            }, failure);

          }, failure);
        }, failure);
      }, failure);

      document.body.appendChild(iframe2);
    }, failure);

    document.body.appendChild(iframe1);
    document.body.appendChild(textarea);

    document.body.appendChild(button);
  }, 2000);

});
