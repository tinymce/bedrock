// var jsc = require('jscheck');
var attempt = require('../../src/js/bedrock/core/attempt');

var jsc = require('jsverify');
for (var i in jsc) {
  console.log(i);
}

// var specs = require('../props/specifiers');

// jsc.property("+0 === -0", function () {
//   return +0 === -0;
// });

// var attemptSpec = jsc.tuple(function () {
//   return jsc.nat.generator;
//   // return jsc.generator.boolean
//   return jsc.boolean.smap(function (success) {
//     return success;
//   });
//   var success = jsc.boolean()();
//   return success === true ? attemptPassedSpec() : attemptFailedSpec();
// };

var attemptPassedSpec = jsc.bless({
  generator: function () {
    return attempt.passed(
      jsc.json.generator(1)
    );
  },
  show: attempt.toString
});



var attemptFailedSpec = jsc.bless({
  generator: function () {
    return attempt.failed(
      jsc.array(
        jsc.number,
        jsc.string
      ).generator(1)
    );
  },
  show: attempt.toString
});

var attemptSpec = jsc.bless({
  generator: function () {
    var b = jsc.bool.generator();
    return b === true ? attemptPassedSpec.generator() : attemptFailedSpec.generator();
    // return function () {
    //   return v === true ? attemptPassedSpec : attemptFailedSpec;
    // ;
  },
  show: attempt.toString
});


var sort = function (arr) {
  return [];
};


  var propFailed = jsc.property("failed attempt -> hasPassed === false", attemptFailedSpec, function (arr) {
    return attempt.hasPassed(arr) === false;
  });

  var propSucceeded = jsc.property("successful attempt -> hasPassed === true", attemptPassedSpec, function (arr) {
    return attempt.hasPassed(arr) === true;
  });

  var concat1 = jsc.property('attempt.concat should pass if all true', jsc.array(attemptPassedSpec), function (attempts) {
    var result = attempt.concat(attempts);
    return attempt.hasPassed(result);
  });

  var concat2 = jsc.property('attempt.concat should fail if any have failed', jsc.array(attemptSpec), function (attempts) {
    var result = attempt.concat(attempts);
    var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
    return attempt.hasPassed(result) === allPassed;
  });

  var concat3 = jsc.property('attempt.concat should concatenate any error messages', jsc.array(attemptSpec), function (attempts) {
    var result = attempt.concat(attempts);
    var failed = attempts.filter(function (at) { return !attempt.hasPassed(at); });
    var failedErrors = failed.reduce(function (rest, f) {
      var current = attempt.cata(f, function (x) {
        return x;
      }, function () {
        return [ ];
      });
      return rest.concat(current);
    }, []);

    return attempt.cata(result, function (errs) {
      console.log('failedErrors', failedErrors);
      console.log('errors', errs);
      return jsc.utils.isEqual(errs, failedErrors);
    }, function (v) {
      console.log('passing', v, attempt.hasPassed(result), failed);
      return jsc.utils.isEqual([ ], failed);
    });
  });
// jsc.test(
//   'Check attempt.concat only passes if all are success',
//   function (verdict, attempts) {
//     var result = attempt.concat(attempts);

//     var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
//     verdict(allPassed ? attempt.hasPassed(result) : attempt.hasPassed(result));
//   },
//   [
//     jsc.array(
//       jsc.number(10)(),
//       specs.attemptSpec
//     )
//   ],
//   function (attempts) {
//     var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
//     return allPassed ? 'All passed' : 'Some failed';
//   }
// );

// jsc.test(
//   'Check attempt.concat',
//   function (verdict, attempts) {
//     var result = attempt.concat(attempts);

//     var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
//     verdict(allPassed ? attempt.hasPassed(result) : !attempt.hasPassed(result));
//   },
//   [
//     jsc.array(
//       jsc.number(10)(),
//       specs.attemptSpec
//     )
//   ],
//   function (attempts) {
//     var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
//     return allPassed ? 'All passed' : 'Some failed';
//   }
// );