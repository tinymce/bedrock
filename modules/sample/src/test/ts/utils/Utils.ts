import Promise from '@ephox/wrap-promise-polyfill';

const post = (url: string, data: Record<string, any>): Promise<void> => {
  return new Promise((onSuccess, onFailure) => {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status == 200) {
          onSuccess();
        } else {
          onFailure();
        }
      }
    };

    request.onerror = function (err) {
      debugger;
      console.error(err);
      onFailure();
    };

    request.open('POST', url);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(data));
  });
};

const sendText = (selector: string, text: string): Promise<void> =>
  post('/keys', { selector, keys: [ { text } ] });

const sendKeyCombo = (selector: string, key: string, modifiers: Record<string, boolean>): Promise<void> =>
  post('/keys', { selector, keys: [ { combo: { ...modifiers, key } } ] });

const sendMouse = (selector: string, type: 'move' | 'click' | 'down' | 'up'): Promise<void> =>
  post('/mouse', { selector, type });

export {
  post,
  sendKeyCombo,
  sendText,
  sendMouse
};