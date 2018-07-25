import * as UnitTest from '../src/client/ts/api/UnitTest';

declare let assert;

UnitTest.test('SyncPass Test', () => {
  assert.eq(1, 1);

});