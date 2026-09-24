import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Differ from '../../../main/ts/api/Differ';

describe('Differ', () => {
  it('does stuff', () => {
    const expected = 'a\nx\ny\nc';
    const actual = 'a\nb\nc';

    assert.deepEqual(Differ.diffPrettyText(expected, actual),
      '  | a\n' +
      '- | x\n' +
      '- | y\n' +
      '+ | b\n' +
      '  | c'
    );

    assert.deepEqual(Differ.diffPrettyHtml(expected, actual),
      '<span>a</span><br />' +
      '<del style="background:#ffe6e6;">x</del><br />' +
      '<del style="background:#ffe6e6;">y</del><br />' +
      '<ins style="background:#e6ffe6;">b</ins><br />' +
      '<span>c</span><br />'
    );
  });

  it('marks expected-only lines as removed and actual-only lines as added', () => {
    const expected = 'only-in-expected';
    const actual = 'only-in-actual';

    assert.deepEqual(Differ.diffPrettyText(expected, actual),
      '- | only-in-expected\n' +
      '+ | only-in-actual'
    );

    assert.deepEqual(Differ.diffPrettyHtml(expected, actual),
      '<del style="background:#ffe6e6;">only-in-expected</del><br />' +
      '<ins style="background:#e6ffe6;">only-in-actual</ins><br />'
    );
  });
});
