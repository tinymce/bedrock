import { UnitTest } from '@ephox/bedrock-client'
import * as assert from '../../../modules/client/src/main/ts/api/LegacyAssert';

UnitTest.test('SyncFail Test', () => {
  assert.eq(1, 2);

});
