import { Assert, describe, it } from '@ephox/bedrock-client';

describe('CustomRouteTest', () => {
  const sendTest = (url: string, responseType: XMLHttpRequestResponseType, assert: (xhr: XMLHttpRequest) => void) => (done: (err?: any) => void) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('load', () => {
      try {
        assert(xhr);
        done();
      } catch (e) {
        done(e);
      }
    });

    xhr.open('GET', url);
    xhr.responseType = responseType;
    xhr.send();
  };

  it('undefined route', sendTest('/custom/non-existent', 'json', (xhr) => {
    Assert.eq('Status', 404, xhr.status);
    Assert.eq('Content Type', 'text/plain; charset=utf-8', xhr.getResponseHeader('Content-Type'));
  }));

  it('image binary file route', sendTest('/custom/image', 'arraybuffer', (xhr) => {
    Assert.eq('Status', 200, xhr.status);
    Assert.eq('Content Type', 'image/jpeg', xhr.getResponseHeader('Content-Type'));
    Assert.eq('Content Length', '95986', xhr.getResponseHeader('Content-Length'));
  }));

  it('text binary file route', sendTest('/custom/text', 'text', (xhr) => {
    Assert.eq('Status', 200, xhr.status);
    Assert.eq('Content Type', 'text/plain; charset=utf-8', xhr.getResponseHeader('Content-Type'));
    Assert.eq('Content Length', '123', xhr.getResponseHeader('Content-Length'));
    Assert.eq('Content', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', xhr.response);
  }));
});