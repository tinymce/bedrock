import { Suite, Test } from 'mocha';

export const isTest = (testOrSuite: Test | Suite): testOrSuite is Test => {
  return Object.prototype.hasOwnProperty.call(testOrSuite, 'type') && (testOrSuite as Test).type === 'test';
};

export const getTests = (suite: Suite): Test[] => {
  return suite.tests.concat(suite.suites.reduce<Test[]>((acc, child) => {
    return acc.concat(getTests(child));
  }, []));
};

export const filterOmittedTests = (testOrSuite: Test | Suite): void => {
  const parent = testOrSuite.parent;
  if (parent !== undefined) {
    if (isTest(testOrSuite)) {
      parent.tests = parent.tests.filter((test) => test !== testOrSuite);
    } else {
      parent.suites = parent.suites.filter((suite) => suite !== testOrSuite);
    }

    if (parent.tests.length === 0 && parent.suites.length === 0) {
      filterOmittedTests(parent);
    }
  }
};