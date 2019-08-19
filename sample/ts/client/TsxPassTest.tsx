import * as UnitTest from '../../../src/client/ts/api/UnitTest';
import * as assert from '../../../src/client/ts/api/Assert';

UnitTest.test('SyncPass Test', () => {
  const React = {
    createElement: (...props) => {}
  };
  const el = <div></div>;
  assert.eq(1, 1);
});
