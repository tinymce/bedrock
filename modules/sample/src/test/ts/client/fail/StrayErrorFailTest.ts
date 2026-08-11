import { describe, it } from '@ephox/bedrock-client';

const rejectLater = (message: string, delay: number) => {
  // a floating promise, like a waiter that is still polling after the test has moved on
  new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

describe('Stray Error Fail', () => {
  it('times out with a waiter still in flight', function () {
    this.timeout(300);
    rejectLater('waiter still in flight', 600);
    return new Promise<void>((resolve) => setTimeout(resolve, 2000));
  });

  it('passes but leaves a rejection behind', () => {
    rejectLater('rejected after the test passed', 200);
  });

  it('runs after the stray rejections land', () => new Promise<void>((resolve) => setTimeout(resolve, 500)));
});
