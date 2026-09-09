import { Assert, UnitTest } from '@ephox/bedrock-client';

// We now use secure contexts a lot in TinyMCE. Verify that bedrock remote (AWS and LT) both offer secure contexts.
UnitTest.test('Secure context Test', () => {
  Assert.eq('bedrock should be served on a secure context', true, window.isSecureContext);
});
