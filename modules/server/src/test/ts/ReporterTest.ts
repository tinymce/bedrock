import * as fc from 'fast-check';
import * as Reporter from '../../main/ts/bedrock/core/Reporter';
import { assert } from 'chai';
import { Eq } from '@ephox/dispute';

describe('Reporter.splitCdatas', () => {
  it('does not split ascii strings', () => {
    fc.assert(fc.property(fc.string({ unit: 'grapheme-ascii'}), (s) => Eq.eqAny.eq(
      [s],
      Reporter.splitCdatas(s)
    )));
  });

  it('splits cdata boundaries', () => {
    assert.deepEqual(
      Reporter.splitCdatas(']]>'),
      [']]', '>']
    );

    fc.assert(fc.property(fc.string({ unit: 'grapheme-ascii'}), fc.string({ unit: 'grapheme-ascii'}), (a, b) => Eq.eqAny.eq(
      [a + ']]', '>' + b],
      Reporter.splitCdatas(a + ']]>' + b)
    )));
  });
});
