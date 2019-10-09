import * as UnitTest from '../../../modules/client/src/main/ts/api/UnitTest';
import * as assert from '../../../modules/client/src/main/ts/api/LegacyAssert';

UnitTest.test('SyncPass Test', () => {
  const React = {
    createElement: (...props) => {}
  };
  const el = <div></div>;
  assert.eq(1, 1);
});
