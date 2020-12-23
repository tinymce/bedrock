import { Global, TestGlobals } from '@ephox/bedrock-common';

const globals: TestGlobals = Global;

const {
  before,
  beforeEach,
  after,
  afterEach,

  describe,
  xdescribe,
  context,
  xcontext,

  it,
  xit,
  specify,
  xspecify
} = globals;

export {
  before,
  beforeEach,
  after,
  afterEach,

  describe,
  xdescribe,
  context,
  xcontext,

  it,
  xit,
  specify,
  xspecify
};