import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Differ from '../../../main/ts/api/Differ';

describe('Differ', () => {
  it('does stuff', () => {
    const text1 = 'a\nx\ny\nc';
    const text2 = 'a\nb\nc';

    assert.deepEqual(Differ.diffPrettyText(text1, text2),
      '  | a\n' +
      '- | x\n' +
      '- | y\n' +
      '+ | b\n' +
      '  | c'
    );

    assert.deepEqual(Differ.diffPrettyHtml(text1, text2),
      '<span>a</span><br />' +
      '<del style="background:#ffe6e6;">x</del><br />' +
      '<del style="background:#ffe6e6;">y</del><br />' +
      '<ins style="background:#e6ffe6;">b</ins><br />' +
      '<span>c</span><br />'
    );
  });
});
