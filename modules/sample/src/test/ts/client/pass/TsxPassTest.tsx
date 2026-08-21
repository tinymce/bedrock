import { Assert, UnitTest } from '@ephox/bedrock-client';
import * as React from 'preact/compat';

UnitTest.test('TsxPass Test', () => {
  const el = <div>blah</div>;
  Assert.eq('', el, el);
});
