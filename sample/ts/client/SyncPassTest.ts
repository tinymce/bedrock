import * as UnitTest from '../../../src/client/ts/api/UnitTest';

import * as assert from '../../../src/client/ts/api/LegacyAssert';

UnitTest.test('SyncPass Test', () => {
  assert.eq(1, 1);

});