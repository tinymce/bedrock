type SuccessCallback = () => void;
type FailureCallback = (error: string | Error, logs) => void;

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


const processLog = (err, logs) => {
  const outputToStr = function (indent, entries) {
    let everything = [ ];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const output = (function () {
        const traceLines = entry.trace === null ? [ ] : [ '', '', '' ].concat(entry.trace.split('\n'));

        if (entry.entries.length === 0) {
          if (entry.trace === null) {
            return [ indent + '*  ' + entry.message ];
          } else {
            return [ indent + '*  ' + entry.message ].concat(traceLines);
          }
        } else {
          // We have entries ... let's format them.
          return [ indent + '*  ' + entry.message ].concat(
            outputToStr(indent + '  ', entry.entries)
          ).concat(traceLines);
        }
      })();
      everything = everything.concat(output)
    }
    return everything;
  };

  const processed = outputToStr('  ', logs.history);

  return JSON.stringify({
    error: err instanceof Error ? err.message : err,
    logs: processed
  }, null, 2);
}

var asynctest = function (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) {
  register(name, function (success, failure) {
    test(success, function (err, logs) {
      const failureMessage = logs !== undefined ? processLog(err, logs) : err;
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