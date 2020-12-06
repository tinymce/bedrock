export interface Attempt<E, A> {
  readonly foldAttempt: <B>(onFailed: (e: E) => B, onPassed: (a: A) => B) => B;
}

const failed = <E, A>(err: E): Attempt<E, A> => {
  return {
    foldAttempt: (onFailed, _onPassed) => {
      return onFailed(err);
    }
  };
};

const passed = <E, A>(value: A): Attempt<E, A> => {
  return {
    foldAttempt: (onFailed, onPassed) => {
      return onPassed(value);
    }
  };
};

const cata = <E, A, B>(attempt: Attempt<E, A>, onFailed: (e: E) => B, onPassed: (a: A) => B): B => {
  return attempt.foldAttempt(onFailed, onPassed);
};

const bind = <E, A, B>(firstAttempt: Attempt<E, A>, f: (a: A) => Attempt<E, B>): Attempt<E, B> => {
  return firstAttempt.foldAttempt<Attempt<E, B>>(failed, f);
};

const map = <E, A, B>(firstAttempt: Attempt<E, A>, f: (a: A) => B): Attempt<E, B> => {
  return firstAttempt.foldAttempt<Attempt<E, B>>(failed, (v) => passed(f(v)));
};

const list = <E, A>(firstAttempt: Attempt<E, A>, fs: Array<(a: A) => Attempt<E, A>>): Attempt<E, A> => {
  return fs.reduce((rest, x) => {
    return bind(rest, x);
  }, firstAttempt);
};

const carry = <E, A, B, C> (firstAttempt: Attempt<E[], A>, secondAttempt: Attempt<E[], B>, f: (a: A, b: B) => Attempt<E[], C>): Attempt<E[], C> => {
  return cata(firstAttempt, (errs) => {
    return cata(secondAttempt, (sErrs) => {
      return failed(errs.concat(sErrs));
    }, (_) => {
      return failed(errs);
    });
  }, (fValue) => {
    return cata(secondAttempt, (sErrs) => {
      return failed(sErrs);
    }, (sValue) => {
      return f(fValue, sValue);
    });
  });
};

const concat = <E, A>(attempts: Array<Attempt<E[], A>>): Attempt<E[], A[]> => {
  // take a list of attempts, and turn them info an attempt of a list.
  return attempts.reduce((rest: Attempt<E[], A[]>, b) => {
    return carry(rest, b, (x, y) => {
      return passed(x.concat([y]));
    });
  }, passed([] as A[]));
};

const toString = <E, A>(attempt: Attempt<E, A>): string => {
  return cata(attempt, (errs) => {
    return 'attempt.failed(' + JSON.stringify(errs) + ')';
  }, (value) => {
    return 'attempt.passed(' + JSON.stringify(value) + ')';
  });
};

const hasPassed = <E, A>(attempt: Attempt<E, A>): boolean => {
  return cata(attempt, () => false, () => true);
};

export const Attempt = {
  failed,
  passed,
  cata,
  bind,
  map,
  list,
  carry,
  concat,
  toString,
  hasPassed
};
