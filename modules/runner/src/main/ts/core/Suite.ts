import { HookType, Suite } from '@ephox/bedrock-common';
import { getFullTitle } from './Utils';

const create = (title: string, root: boolean, parent?: Suite) => {
  const suite: Suite = {
    title,
    hooks: {
      [HookType.Before]: [],
      [HookType.BeforeEach]: [],
      [HookType.After]: [],
      [HookType.AfterEach]: [],
    },
    root,
    suites: [],
    tests: [],
    parent,
    _only: false,
    _skip: false,
    isSkipped: () => {
      return suite._skip || parent?.isSkipped() === true;
    },
    fullTitle: () => getFullTitle(suite, '/')
  };
  return suite;
};

export const createSuite = (title: string, parent: Suite): Suite =>
  create(title, false, parent);

export const createRootSuite = (title: string): Suite =>
  create(title, true);