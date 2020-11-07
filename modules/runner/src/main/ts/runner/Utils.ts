import { Tests } from '@ephox/bedrock-common';

export const countTests = (suite: Tests.Suite): number =>
  suite.tests.length + suite.suites.reduce((acc, suite) => acc + countTests(suite), 0);

export const loop = <T>(items: T[], fn: (item: T, next: () => void) => void, done: () => void, index = 0): void => {
  if (index < items.length) {
    fn(items[index], () => loop(items, fn, done, index + 1));
  } else {
    done();
  }
};