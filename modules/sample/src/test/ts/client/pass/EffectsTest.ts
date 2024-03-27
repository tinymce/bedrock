import { after, Assert, before, beforeEach, context, describe, it } from '@ephox/bedrock-client';

import { sendText, sendKeyCombo } from '../../utils/Utils';

describe('Effects', () => {
  const isPhantom = navigator.userAgent.indexOf('PhantomJS') > -1;
  const isMac = navigator.platform.indexOf('Mac') > -1;

  context('keys', () => {
    const ctrlKeyModifier = isMac && !isPhantom ? { metaKey: true } : { ctrlKey: true };
    let textarea: HTMLTextAreaElement;

    before(() => {
      textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
    });

    after(() => {
      if (textarea) {
        document.body.removeChild(textarea);
      }
    });

    beforeEach(() => {
      textarea.value = '';
    });

    it('should cut and paste using keyboard shortcuts', async function () {
      // Cut/Copy doesn't work on phantomjs
      if (isPhantom) {
        this.skip();
      }

      textarea.value = 'hello world';
      textarea.select();

      await sendKeyCombo('textarea', 'x', ctrlKeyModifier);
      Assert.eq('Textarea value after cutting', '', textarea.value);

      await sendKeyCombo('textarea', 'v', ctrlKeyModifier);
      Assert.eq('Textarea value after pasting', 'hello world', textarea.value);
    }).retries(5);

    it('should type text', async () => {
      await sendText('textarea', 'hello world!');
      Assert.eq('Textarea value after typing', 'hello world!', textarea.value);
    });
  });
});