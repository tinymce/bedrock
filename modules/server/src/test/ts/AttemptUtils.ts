import { Arbitrary, default as fc } from 'fast-check';
import { Attempt } from '../../main/ts/bedrock/core/Attempt';
import { assert } from 'chai';

export const arbAttemptFailed = <E, A> (arbe: Arbitrary<E>): Arbitrary<Attempt<E, A>> =>
  arbe.map<Attempt<E, A>>(Attempt.failed);

export const arbAttemptPassed = <E, A> (arba: Arbitrary<A>): Arbitrary<Attempt<E, A>> =>
  arba.map<Attempt<E, A>>(Attempt.passed);

export const arbAttempt = <E, A> (arbe: Arbitrary<E>, arba: Arbitrary<A>): Arbitrary<Attempt<E, A>> =>
  fc.oneof(arbAttemptFailed<E, A>(arbe), arbAttemptPassed<E, A>(arba));

export const assertErrors = <E> (expected: E, actual: Attempt<E, any>): void => {
  Attempt.cata(actual, (errs) => {
    assert.deepEqual(errs, expected);
  }, () => {
    assert.fail('Expected errors: ' + JSON.stringify(expected));
  });
};

export const assertResult = <A>(expected: A, actual: Attempt<any, A>): void => {
  Attempt.cata(actual, (errs) => {
    assert.fail('Unexpected errors: ' + JSON.stringify(errs));
  }, result => {
    assert.deepEqual(result, expected);
  });
};
