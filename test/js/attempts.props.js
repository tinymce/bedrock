// var jsc = require('jscheck');
var attempt = require('../../src/js/bedrock/core/attempt');

var jsc = require('jsverify');

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
      jsc.object
    );
  },
  show: attempt.toString
});

// var attemptPassedSpec = jsc.bool.smap(
//   function (b) { return b === true ? attempt.failed(true); },
//   function (at) { return false; },
//   function (at) {
//     return 'dog';
//   }
// );

var attemptFailedSpec = jsc.bless({
  generator: function () {
    return attempt.failed(
      jsc.array(
        jsc.number,
        jsc.string
      )
    );
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

// jsc.on_result(function (value) {
//   if (! value.ok) {
//     console.error(value);
//     // process.exit(-1);
//   } else {
//     console.log(value);
//   }
// });

// jsc.on_report(function (value) {
//   console.log('report.value',value);
// });

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