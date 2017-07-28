asynctest(
  'Actions in IFrames',

  [

  ],

  function () {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];


    /*
     * This frame will get sent keyboard events to its content editable body
     */
    var iframe1 = document.createElement('iframe');
    iframe1.setAttribute('class', 'iframe-keyboard');

    /*
     * This textarea will get sent keyboard events 
     */
    var textarea = document.createElement('textarea');


    /* 
     * This frame will get sent mouse events to its select inside
     */
    var iframe2 = document.createElement('iframe');
    iframe2.setAttribute('class', 'iframe-mouse');

    /*
     * This button will get sent mouse events
     */
    var button = document.createElement('button');
    button.innerHTML = 'Click me';
    button.setAttribute('class', 'button-mouse');
    button.addEventListener('click', function () {
      button.style.setProperty('background', '#cadbee');
      button.setAttribute('data-clicked', 'clicked');
    });


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


    var sendText = function (selector, text, onSuccess, onFailure) {
      post('/keys', { selector: selector, keys: [ { text: text } ] }, onSuccess, onFailure);
    };

    var sendMouse = function (selector, type, onSuccess, onFailure) {
      post('/mouse', { selector: selector, type: type }, onSuccess, onFailure);
    };


    var loadContentIntoFrame = function (fr, content, onSuccess, onFailure) {
      var listener = function () {
        fr.removeEventListener('load', listener);
        try {
          var doc = fr.contentWindow.document;
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

      loadContentIntoFrame(iframe1, '<! doctype><html><body contenteditable="true"><p>!</p></body></html>', function (fr1) {
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
        });
        
        document.body.appendChild(iframe2);
      }, failure);


      document.body.appendChild(iframe1);
      document.body.appendChild(textarea);
      
      document.body.appendChild(button);
    }, 2000);


  }
);