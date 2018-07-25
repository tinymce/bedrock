import * as UnitTest from '../src/client/ts/api/UnitTest';

declare let assert;

UnitTest.test('SyncFail Test', () => {
  assert.eq(1, 2);

});