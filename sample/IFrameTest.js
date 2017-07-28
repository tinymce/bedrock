asynctest(
  'Actions in IFrames',

  [

  ],

  function () {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];

    var iframe = document.createElement('iframe');
    iframe.setAttribute('class', 'iframe-class');

    var frameLoader = function () {
      iframe.removeEventListener('load', frameLoader);
      console.log('iframe loading');
      try {
        var doc = iframe.contentWindow.document;
        doc.open('text/html', 'replace');
        doc.writeln('<! doctype><html><body contenteditable="true">!</body></html>');
        doc.close();
      } catch (err) {
        console.error(err);
      }

      sendText('iframe=>body', 'going', function () {
        sendText('textarea', 'blah', function () {
          try {
            assert.eq('going!', iframe.contentWindow.document.body.innerHTML.trim());
          } catch (err){
            return failure(err);
          }

          try {
            assert.eq('blah', textarea.value);
          } catch (err) {
            return failure(err);
          }


          document.body.removeChild(iframe);
          document.body.removeChild(textarea);
          success();
        }, failure);
      }, failure);
    };

    iframe.addEventListener('load', frameLoader);


    var sendText = function (selector, text, onSuccess, onFailure) {
      console.log('sending text');
      var request = new XMLHttpRequest();
      request.open('POST', '/keys', true);
      request.onload = function () {
        onSuccess();
      };

      request.onerror = function () {
        onFailure();
      };

      request.send(JSON.stringify({
        selector: selector,
        keys: [{ text: text }]
      }));
    };

    
    document.body.appendChild(iframe);
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
  }
);