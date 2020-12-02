import { Suite, Test } from 'mocha';

export const isSuite = (testOrSuite: Test | Suite): testOrSuite is Suite => {
  return Object.prototype.hasOwnProperty.call(testOrSuite, '_onlySuites');
};

export const getTests = (suite: Suite): Test[] => {
  return suite.tests.concat(suite.suites.reduce((acc, child) => {
    return acc.concat(getTests(child));
  }, [] as Test[]));
};

export const filterOmittedTests = (testOrSuite: Test | Suite): void => {
  const parent = testOrSuite.parent;
  if (parent !== undefined) {
    if (isSuite(testOrSuite)) {
      parent.suites = parent.suites.filter((suite) => suite !== testOrSuite);
    } else {
      parent.tests = parent.tests.filter((test) => test !== testOrSuite);
    }

    if (parent.tests.length === 0 && parent.suites.length === 0) {
      filterOmittedTests(parent);
    }
  }
};