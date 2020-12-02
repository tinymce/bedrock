import { Global } from '@ephox/bedrock-common';
import { MochaGlobals } from 'mocha';

const mochaGlobals: MochaGlobals = Global;

const before = mochaGlobals.before;
const beforeEach = mochaGlobals.beforeEach;
const after = mochaGlobals.after;
const afterEach = mochaGlobals.afterEach;

const describe = mochaGlobals.describe;
const xdescribe = mochaGlobals.xdescribe;
const context = mochaGlobals.context;
const xcontext = mochaGlobals.xcontext;

const it = mochaGlobals.it;
const xit = mochaGlobals.xit;
const specify = mochaGlobals.specify;
const xspecify= mochaGlobals.xspecify;

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