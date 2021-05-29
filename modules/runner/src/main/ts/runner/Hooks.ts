import { Hook, HookType, RunnableState, Suite, Test } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import * as Context from '../core/Context';
import { SkipError } from '../errors/Errors';
import { runWithErrorCatcher, runWithTimeout } from './Run';
import { loop } from './Utils';

const DEFAULT_HOOK_TIMEOUT = 2000;

export const getHooks = (suite: Suite, type: HookType, includeParents: boolean): Hook[] => {
  if (suite.isSkipped()) {
    return [];
  } else {
    const hooks = suite.hooks[type];
    if (includeParents && suite.parent !== undefined) {
      const parentHooks = getHooks(suite.parent, type, includeParents);
      // Reverse the suite hook order for after hooks so it gets the suite hooks bottom up
      if (type === HookType.After || type === HookType.AfterEach) {
        return hooks.concat(parentHooks);
      } else {
        return parentHooks.concat(hooks);
      }
    } else {
      return hooks;
    }
  }
};

const handleSkippedHook = (suite: Suite, type: HookType, currentTest?: Test) => {
  if (type === HookType.Before) {
    suite.suites.forEach((childSuite) => {
      childSuite._skip = true;
    });
    suite.tests.forEach((test) => {
      test.setResult(RunnableState.Skipped);
    });
  } else if (type === HookType.BeforeEach && currentTest !== undefined) {
    currentTest.setResult(RunnableState.Skipped);
  }
};

export const runHooks = (suite: Suite, type: HookType, runOnParents: boolean, currentTest?: Test): Promise<void> => {
  const hooks = getHooks(suite, type, runOnParents);
  return loop(hooks, (hook) => {
    return runWithErrorCatcher(hook, () => runWithTimeout(hook, Context.createContext(hook, currentTest), DEFAULT_HOOK_TIMEOUT));
  }).catch((e) => {
    if (e instanceof SkipError) {
      handleSkippedHook(suite, type, currentTest);
      return Promise.resolve();
    } else {
      return Promise.reject(e);
    }
  });
};

export const runBefore = (suite: Suite, currentTest?: Test): Promise<void> => {
  return runHooks(suite, HookType.Before, false, currentTest);
};

export const runAfter = (suite: Suite, currentTest?: Test): Promise<void> => {
  return runHooks(suite, HookType.After, false, currentTest);
};

export const runBeforeEach = (currentTest: Test): Promise<void> => {
  if (currentTest.parent !== undefined) {
    return runHooks(currentTest.parent, HookType.BeforeEach, true, currentTest);
  } else {
    return Promise.resolve();
  }
};

export const runAfterEach = (currentTest: Test): Promise<void> => {
  if (currentTest.parent !== undefined) {
    return runHooks(currentTest.parent, HookType.AfterEach, true, currentTest);
  } else {
    return Promise.resolve();
  }
};