import { TestError } from '@ephox/bedrock-common';
import { after, afterEach, before, beforeEach, context, describe, it, specify } from './Bdd';
import * as LegacyAssert from './LegacyAssert';
import * as NewAssert from './NewAssert';
import { TestLabel } from './TestLabel';
import * as UnitTest from './UnitTest';

export {
  describe,
  context,
  before,
  beforeEach,
  after,
  afterEach,
  it,
  specify,

  LegacyAssert as assert,
  NewAssert as Assert,
  UnitTest,
  TestLabel,
  TestError
};
