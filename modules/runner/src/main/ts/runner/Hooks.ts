import { Hook, LoggedError, Tests } from '@ephox/bedrock-common';
import { loop } from './Utils';

type LoggedError = LoggedError.LoggedError;

export const getHooks = (suite: Tests.Suite, type: Hook, parents: boolean): Tests.RunFn[] => {
  const hooks: Tests.RunFn[] = suite.hooks?.[type] || [];
  if (parents && suite.parent !== undefined) {
    const allHooks = hooks.concat(getHooks(suite.parent, type, parents));
    return type === Hook.AfterEach || type === Hook.After ? allHooks.reverse() : allHooks;
  } else {
    return hooks;
  }
};

export const runHooks = (suite: Tests.Suite, type: Hook, runOnParents: boolean, success: () => void, failure?: (err: LoggedError) => void): void => {
  const hooks = getHooks(suite, type, runOnParents);
  loop(hooks, (hook, next) => {
    hook(next, (e) => {
      if (failure !== undefined) {
        failure(e);
      }
    });
  }, success);
};