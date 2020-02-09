import { UnitTest, assert } from '@ephox/bedrock-client'

UnitTest.test('SyncPass Test', () => {
  const React = {
    createElement: (...props) => {}
  };
  const el = <div>blah</div>;
  assert.eq(el, el);
});
