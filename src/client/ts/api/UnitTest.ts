type SuccessCallback = () => void;
type FailureCallback = (error: string | Error) => void;

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

var asynctest = function (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) {
  register(name, test);
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