type SuccessCallback = () => void;
type FailureCallback = (error: string | Error, logs?) => void;

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

var register = function (name, test) {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  Global.__tests.push({ name: name, test: test });
};

const cleanStack = (error, linesToRemove=1) => {
  if (error.stack === undefined) {
    return '';
  }

  const lines = error.stack.split('\n');
  const message = lines[0];
  const stack = lines.slice(1 + linesToRemove);
  return message + '\n' + stack.join('\n');
};

const normalizeError = (err) => {
  if (typeof err === 'string') {
    // Create an error object, but strip the stack of the 2 latest calls as it'll
    // just be this function and the previous function that called this (ie asyncTest)
    const error = new Error(err);
    const stack = cleanStack(error, 2);
    return {
      message: error.message,
      stack: stack,
      name: error.name,
      toString: () => stack
    };
  } else {
    return err;
  }
};

const processLog = (err, logs) => {
  const outputToStr = function (numIndent, entries) {
    let everything = [ ];
    let indentString = '';
    for (let i = 0; i < numIndent; i++) {
      indentString += ' ';
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const output = (function () {
        const traceLines = entry.trace === null ? [ ] : [ '', '', '' ].concat(entry.trace.split('\n'));

        if (entry.entries.length === 0) {
          if (entry.trace === null) {
            return [ indentString + '*  ' + entry.message ];
          } else {
            return [ indentString + '*  ' + entry.message ].concat(traceLines);
          }
        } else {
          // We have entries ... let's format them.
          return [ indentString + '*  ' + entry.message ].concat(
            outputToStr(numIndent + 2, entry.entries)
          ).concat(traceLines);
        }
      })();
      everything = everything.concat(output)
    }
    return everything;
  };

  err.logs = outputToStr(2, logs.history);

  return err;
};

var asynctest = function (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) {
  register(name, function (success, failure) {
    test(success, function (err, logs?) {
      const normalizedErr = normalizeError(err);
      const failureMessage = logs !== undefined ? processLog(normalizedErr, logs) : normalizedErr;
      failure(failureMessage);
    });
  });
};



var test = function (name: string, test: SuccessCallback) {
  register(name, function (success, failure) {
    try {
      test();
      success();
    } catch (e) {
      failure(e);
    }
  });
};

var domtest = function (name: string, test: () => Promise<void>) {
  register(name, function (success, failure) {
    // This would later include setup/teardown of jsdoc for atomic tests
    var promise = test();

    if (!(promise instanceof Global.Promise)) {
      throw 'dom tests must return a promise';
    }

    promise.then(function () {
      success();
    }, failure);
  });
};

export {
  test,
  asynctest,
  domtest
};
