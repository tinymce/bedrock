import * as Suite from './Suite';
import * as Assert from './Assert';

Suite.test('SyncFailTest', function () {
  Assert.eq(1, 2);
});
