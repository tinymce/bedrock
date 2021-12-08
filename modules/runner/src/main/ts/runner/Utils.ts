import { Suite, Test } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';

export const countTests = (suite: Suite): number =>
  suite.tests.length + suite.suites.reduce((acc, suite) => acc + countTests(suite), 0);

export const loop = <T>(items: T[], fn: (item: T) => Promise<void>, index = 0): Promise<void> => {
  if (index < items.length) {
    return fn(items[index]).then(() => loop(items, fn, index + 1));
  } else {
    return Promise.resolve();
  }
};

export const getTests = (suite: Suite): Test[] => {
  return suite.tests.concat(suite.suites.reduce<Test[]>((acc, child) => {
    return acc.concat(getTests(child));
  }, []));
};

export const getSuites = (suite: Suite): Suite[] => {
  return suite.suites.concat(suite.suites.reduce<Suite[]>((acc, child) => {
    return acc.concat(getSuites(child));
  }, []));
};

const hasOnly = (suite: Suite): boolean => {
  const onlyTests = suite.tests.filter((test) => test._only);
  const onlySuites = suite.suites.filter((suite) => suite._only);
  if (onlyTests.length > 0 || onlySuites.length > 0) {
    return true;
  } else {
    // Check all the nested child suites
    return suite.suites.some(hasOnly);
  }
};

export const filterOnly = (suite: Suite): void => {
  const onlyTests = suite.tests.filter((test) => test._only);
  const onlySuites = suite.suites.filter((child) => child._only || hasOnly(child));
  if (onlyTests.length > 0) {
    suite.tests = onlyTests;
    suite.suites = [];
  } else if (onlySuites.length > 0) {
    suite.tests = [];
    suite.suites.forEach(filterOnly);
    suite.suites = onlySuites;
  }
};