import { describe, it } from 'mocha';
import { Attempt } from '../../main/ts/bedrock/core/Attempt';
import * as fc from 'fast-check';
import * as deepEqual from 'fast-deep-equal';
import { arbAttempt, arbAttemptFailed, arbAttemptPassed, assertErrors, assertResult } from './AttemptUtils';

describe('attempt.carry', () => {

  it('attempt.carry [ f([err1]), f([err2]) ]', () => {
    assertErrors(['err1', 'err2'], Attempt.carry(
      Attempt.failed(['err1']),
      Attempt.failed(['err2']),
      Attempt.passed
    ));
  });

  it('attempt.carry [ f([err1]), p(good) ]', () => {
    assertErrors(['err1'], Attempt.carry(
      Attempt.failed(['err1']),
      Attempt.passed('good'),
      Attempt.passed
    ));
  });

  it('attempt.carry [ p(good), f([bad]) ]', () => {
    assertErrors(['bad'], Attempt.carry(
      Attempt.passed('good'),
      Attempt.failed(['bad']),
      Attempt.passed
    ));
  });

});

describe('attempt.concat', () => {
  it('attempt.concat [ ]', () => {
    assertResult([], Attempt.concat([]));
  });

  it('attempt.concat [ p(1) ]', () => {
    assertResult([1], Attempt.concat([
      Attempt.passed(1)
    ]));
  });

  it('attempt.concat [ p(1), p(2), p(3) ]', () => {
    assertResult([1, 2, 3], Attempt.concat([
      Attempt.passed(1),
      Attempt.passed(2),
      Attempt.passed(3)
    ]));
  });

  it('attempt.concat [ p(1), f([message]), p(3) ]', () => {
    assertErrors(['message1', 'message2'], Attempt.concat([
      Attempt.passed(1),
      Attempt.failed(['message1', 'message2']),
      Attempt.passed(3)
    ]));
  });

  it('attempt.concat [ p(1), f([message1,2]), f([message3,4]) ]', () => {
    assertErrors(['message1', 'message2', 'message3', 'message4'], Attempt.concat([
      Attempt.passed(1),
      Attempt.failed(['message1', 'message2']),
      Attempt.failed(['message3', 'message4'])
    ]));
  });
});

describe('attempt.list', () => {
  it('attempt.list p(1) -> [ =>f[a], =>p(1) ]', () => {
    assertErrors(['f.1'], Attempt.list(Attempt.passed('1'), [
      i => Attempt.failed<string[], string>(['f.' + i]),
      () => Attempt.passed<string[], string>('done')
    ]));
  });

  it('attempt.list p(1) -> [ =>p(1.*), =>p(2.*), =>p(3.*) ]', () => {
    assertResult('3.2.1.0', Attempt.list(Attempt.passed('0'), [
      i => Attempt.passed('1.' + i),
      i => Attempt.passed('2.' + i),
      i => Attempt.passed('3.' + i)
    ]));
  });
});

describe("Attempt.hasPassed", () => {
  it('is true when passed', () => {
    fc.assert(fc.property(arbAttemptPassed(fc.nat()), Attempt.hasPassed));
  });
  it('is false when failed', () => {
    fc.assert(fc.property(arbAttemptFailed(fc.nat()), (x) => !Attempt.hasPassed(x)));
  });
});

describe("Attempt.concat", () => {
  it("passes if all true", () => {
    fc.assert(fc.property(fc.array(arbAttemptPassed<string[], number>(fc.nat())), (attempts) =>
      Attempt.hasPassed(Attempt.concat(attempts))));
  });

  it('fails if any have failed', () => {
    fc.assert(fc.property(fc.array(arbAttempt<string[], number>(fc.array(fc.string()), fc.nat())), (attempts) => {
      const result = Attempt.concat(attempts);
      const allPassed = attempts.filter(Attempt.hasPassed).length === attempts.length;
      return Attempt.hasPassed(result) === allPassed;
    }));
  });

  it('concatenates error messages', () => {
    fc.assert(fc.property(fc.array(arbAttempt<string[], number>(fc.array(fc.string()), fc.nat())), (attempts) => {
      const result = Attempt.concat(attempts);
      const failed = attempts.filter((at) => !Attempt.hasPassed(at));
      const failedErrors = failed.reduce<string[]>((rest, f) => {
        const current = Attempt.cata(f, (x) => x, () => []);
        return rest.concat(current);
      }, []);


      return Attempt.cata(result,
        (errs) => deepEqual(errs, failedErrors),
        (v) => deepEqual([], failed));
    }));
  });
});
