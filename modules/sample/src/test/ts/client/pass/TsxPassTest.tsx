import { Assert, UnitTest } from '@ephox/bedrock-client';

UnitTest.test('TsxPass Test', () => {
  const React = {
    createElement: (...props) => {}
  };
  const el = <div>blah</div>;
  Assert.eq('', el, el);
});
