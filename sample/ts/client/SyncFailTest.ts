import * as UnitTest from '../../../modules/client/src/main/ts/api/UnitTest';
import * as assert from '../../../modules/client/src/main/ts/api/LegacyAssert';

UnitTest.test('SyncFail Test', () => {
  assert.eq(1, 2);

});
