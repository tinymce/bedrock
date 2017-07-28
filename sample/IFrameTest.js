asynctest(
  'AsyncFailTest',

  [

  ],

  function () {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];

    var iframe = document.createElement('iframe');
    iframe.setAttribute('class', 'iframe-class');
    iframe.addEventListener('load', function () {
      var doc = iframe.contentWindow.document;
      doc.open();
      doc.writeln('<! doctype><html><body contenteditable="true">Body of content editable</body></html>');
      doc.close();

      iframe.contentWindow.document.body.focus();

      sendText('iframe=>body', 'going').then(function () {
        sendText('textarea', 'blah');
      });
    });


    var sendText = function (selector, text) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('POST', '/keys', true);
        request.onload = function () {
          resolve();
        };

        request.onerror = function () {
          reject();
        };

        request.send(JSON.stringify({
          selector: selector,
          keys: [{ text: text }]
        }));
      });
    };

    document.body.appendChild(iframe);


    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.focus();


    setTimeout(function () {
      failure('Failed');
    }, 30000);
  }
);