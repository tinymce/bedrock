import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { MouseWatch } from '../../../main/ts/core/MouseWatch';

const global = globalThis as any;

// The runner watches XMLHttpRequest to spot mouse effects, so tests need one to watch.
// A new class per test keeps each watcher's patch off the next test's prototype.
const fakeXhr = () => class {
  public opened: string[] = [];

  public open(_method: string, url: string): void {
    this.opened.push(url);
  }
};

describe('MouseWatch', () => {
  let original: any;

  beforeEach(() => {
    original = global.XMLHttpRequest;
    global.XMLHttpRequest = fakeXhr();
  });

  afterEach(() => {
    global.XMLHttpRequest = original;
  });

  const openUrl = (url: string) => {
    const xhr = new global.XMLHttpRequest();
    xhr.open('post', url);
    return xhr;
  };

  it('should not report the mouse as moved before any effects are sent', () => {
    const mouse = MouseWatch();
    openUrl('/tests/start');
    assert.isFalse(mouse.hasMoved());
  });

  it('should report the mouse as moved once a mouse effect is sent', () => {
    const mouse = MouseWatch();
    openUrl('/mouse');
    assert.isTrue(mouse.hasMoved());
    mouse.clear();
    assert.isFalse(mouse.hasMoved());
  });

  it('should not treat urls that merely contain "mouse" as mouse effects', () => {
    const mouse = MouseWatch();
    openUrl('/project/src/test/ts/browser/MouseTest.js');
    openUrl('/mouseover');
    assert.isFalse(mouse.hasMoved());
  });

  it('should still send the original request', () => {
    MouseWatch();
    const xhr = openUrl('/mouse?session=1');
    assert.deepEqual(xhr.opened, [ '/mouse?session=1' ]);
  });
});
