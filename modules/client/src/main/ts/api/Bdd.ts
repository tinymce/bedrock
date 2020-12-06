import { Global } from '@ephox/bedrock-common';
import { MochaGlobals } from 'mocha';

const mochaGlobals: MochaGlobals = Global;

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
} = mochaGlobals;

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