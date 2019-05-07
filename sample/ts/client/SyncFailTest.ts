import * as UnitTest from '../../../src/client/ts/api/UnitTest';

import * as assert from '../../../src/client/ts/api/LegacyAssert';

UnitTest.test('SyncFail Test', () => {
  assert.eq(1, 2);

});