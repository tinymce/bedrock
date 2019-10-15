import { UnitTest, assert } from '@ephox/bedrock-client'

UnitTest.test('SyncPass Test', () => {
  const React = {
    createElement: (...props) => {}
  };
  const el = <div></div>;
  assert.eq(1, 1);
});
