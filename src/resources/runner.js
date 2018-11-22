/*global ephox */
/*jshint jquery:true */
(function (global) {
  global.ephox = global.ephox || {};
  global.ephox.bedrock = global.ephox.bedrock || {};
  var api = global.ephox.bedrock;

  var urlParams = function() {
    var params = {};
    var qs = window.location.search;
    qs = qs.split('+').join(' ');
    var re = /[?&]?([^=]+)=([^&]*)/g;
    var m;
    while (m = re.exec(qs)) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
  };

  var posInt = function(str) {
    if (typeof str === 'string') {
      var num = parseInt(str, 10);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
    return 0;
  };

  var makeSessionId = function() {
    return '' + Math.ceil((Math.random() * 100000000));
  };

  var getParams = function () {
    var params = urlParams();
    return {
      session: params['session'] || makeSessionId(),
      offset: posInt(params['offset']),
      failed: posInt(params['failed']),
      retry: posInt(params['retry']),
    }
  };

  var chunk; // set during loadtests
  var retries; // set during loadtests
  var testscratch = null; // set per test, private dom scratch area for the current test to use.
  var globalTests = global.__tests ? global.__tests : [];

  var timer = ephox.bolt.test.report.timer;
  var errors = ephox.bolt.test.report.errors;

  var params = getParams();

  var makeUrl = function(session, offset, failed, retry) {
    var baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    if (offset > 0) {
      var rt = (retry > 0 ? '&retry=' + retry : '');
      return baseUrl + '?session=' + session + '&offset=' + offset + '&failed=' + failed + rt;
    } else {
      return baseUrl;
    }
  };

  var sendJson = function (url, data, onSuccess, onError) {
    if (onSuccess === undefined) onSuccess = function() {};
    if (onError === undefined) onError = function() {};
    $.ajax({
      method: 'post',
      url: url,
      dataType: 'json',
      success: onSuccess,
      error: onError,
      data: JSON.stringify(data)
    });
  };

  var sendKeepAlive = function(session, onSuccess, onError) {
    sendJson('/tests/alive', {
      session: session
    }, onSuccess, onError);
  };

  var sendTestStart = function (session, file, name, onSuccess, onError) {
    sendJson('/tests/start', {
      session: session,
      file: file,
      name: name,
    }, onSuccess, onError);
  };

  var sendTestResult = function(session, file, name, passed, time, error, onSuccess, onError) {
    sendJson('/tests/result', {
      session: session,
      file: file,
      name: name,
      passed: passed,
      time: time,
      error: error
    }, onSuccess, onError);
  };

  var sendDone = function (session, onSuccess, onError) {
    var getCoverage = function () {
      return typeof __coverage__ === 'undefined' ? { } : __coverage__;
    };

    sendJson('/tests/done', {
      session: session,
      coverage: getCoverage()
    }, onSuccess, onError);
  };

  var reporter = (function () {
    var current = $('<span />').addClass('progress').text(params.offset);

    $('document').ready(function () {
      $('body')
        .append($('<div />')
        .append($('<span />').text('Suite progress: '))
        .append(current)
        .append($('<span />').text('/'))
        .append($('<span />').text(globalTests.length))
      );
    });

    var initial = new Date();
    var passCount = 0;
    var failCount = 0;

    var stopOnFailure = false;

    var keepAliveTimer = setInterval(function() {
      sendKeepAlive(params.session, undefined, function() {
        // if the server shutsdown stop trying to send messages
        clearInterval(keepAliveTimer);
      });
    }, 5000);

    var summary = function() {
      return {
        passed: passCount + (params.offset - params.failed),
        failed: failCount + params.failed,
      };
    };

    var test = function (file, name) {
      sendTestStart(params.session, file, name);
      var starttime = new Date();
      var el = $('<div />').addClass('test running');

      var output = $('<div />').addClass('output');
      var marker = $('<span />').text('[running]').addClass('result');
      var testfile = $('<span />').text(file).addClass('testfile');
      var nameSpan = $('<span />').text(name).addClass('name');
      var error = $('<span />').addClass('error-container');
      var time = $('<span />').addClass('time');
      output.append(marker, ' ', nameSpan, ' [', time, '] ', error, ' ', testfile);
      var scratch = $('<div />').addClass('scratch');
      el.append(output, scratch);
      $('body').append(el);

      testscratch = scratch.get(0);  // intentional, see top of file for var decl.

      var pass = function (onDone) {
        passCount++;
        el.removeClass('running').addClass('passed').addClass('hidden');
        marker.text('[passed]').addClass('passed');
        var testTime = timer.elapsed(starttime);
        time.text(testTime);
        current.text(params.offset + passCount + failCount);
        sendTestResult(params.session, file, name, true, testTime, null, onDone, onDone);
      };

      var fail = function (e, onDone) {
        failCount++;
        el.removeClass('running').addClass('failed');
        marker.text('[failed]').addClass('failed');
        // Don't use .text() as it strips out newlines in IE, even when used
        // on a pre tag.
        var pre = $('<pre/>')
          .addClass('error')
          .html((e.diff !== undefined ? failhtml : failnormal)(e));
        error.append(pre);
        var testTime = timer.elapsed(starttime);
        time.text(testTime);
        current.text(params.offset + passCount + failCount);
        if (stopOnFailure) {
          current.text('\u274c @ ' + current.text());
        }
        sendTestResult(params.session, file, name, false, testTime, errors.clean(e), onDone, onDone);
      };

      return {
        pass: pass,
        fail: fail
      };
    };

    var done = function () {
      var setAsDone = function () {
        var totalTime = timer.elapsed(initial);
        $('body').append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
        $('.passed.hidden').removeClass('hidden');
      };

      sendDone(params.session, setAsDone, setAsDone);
    };

    var setStopOnFailure = function (flag) {
      stopOnFailure = flag;
    };

    var shouldStopOnFailure = function () {
      return stopOnFailure;
    };

    return {
      summary: summary,
      test: test,
      done: done,
      setStopOnFailure: setStopOnFailure,
      shouldStopOnFailure: shouldStopOnFailure
    };
  })();

  var htmlentities = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var processQUnit = function (html) {
    // Required to make <del> and <ins> stay as tags.
    return html.replace(/&lt;del&gt;/g, '<del>').replace(/&lt;\/del&gt;/g, '</del>').replace(/&lt;ins&gt;/g, '<ins>').replace(/&lt;\/ins&gt;/g, '</ins>');
  };

  var failhtml = function (e) {
    // Provide detailed HTML comparison information
    return 'Test failure: ' + e.message +
      '\nExpected: ' + htmlentities(e.diff.expected) +
      '\nActual: ' + htmlentities(e.diff.actual) +
      '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison)) + '\n\nStack: ' + e.stack;
  };

  var failnormal = function (e) {
    return htmlentities(errors.clean(e));
  };

  var initError = function (e) {
    $('body').append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
  };

  var runGlobalTests = function () {

    var loadNextChunk = function() {
      if (globalTests.length > (params.offset + chunk)) {
        var url = makeUrl(params.session, params.offset + chunk, reporter.summary().failed, 0);
        window.location.assign(url);
      } else {
        reporter.done();
        // for easy rerun reset the URL
        window.history.pushState({}, '', makeUrl(params.session, 0, 0, 0));
      }
    };

    var retryTest = function() {
      var sum = reporter.summary();
      window.location.assign(
        makeUrl(
          params.session,
          sum.passed + sum.failed - 1,
          sum.failed - 1,
          params.retry + 1
        )
      );
    };

    var loadNextTest = function() {
      var sum = reporter.summary();
      window.location.assign(
        makeUrl(
          params.session,
          sum.passed + sum.failed,
          sum.failed,
          0
        )
      );
    };

    var afterFail = function() {
      if (reporter.shouldStopOnFailure()) {
        reporter.done();
        // make it easy to restart at this test
        var sum = reporter.summary();
        var url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
        window.history.pushState({}, '', url);
      } else if (params.retry < retries) {
        retryTest();
      } else {
        loadNextTest();
      }
    };

    var loop = function (tests) {
      if (tests.length > 0) {
        var test = tests.shift();
        var report = reporter.test(test.filePath, test.name);

        try {
          test.test(function () {
            report.pass(function() {
              params.retry = 0;
              var url = makeUrl(params.session, params.offset, params.failed, params.retry);
              window.history.pushState({}, '', url);
              loop(tests);
            });
          }, function (e) {
            console.error(e);
            report.fail(e, afterFail);
          });
        } catch (e) {
          console.error(e);
          report.fail(e, afterFail);

        }
      } else {
        loadNextChunk();
      }
    };

    loop(globalTests.slice(params.offset, params.offset + chunk));
  };

  api.loadtests = function (data) {
    chunk = data.chunk;
    retries = data.retries;
    reporter.setStopOnFailure(data.stopOnFailure);
    runGlobalTests();
  };

  api.testrunner = function () {
    // delay this ajax call until after the reporter status elements are in the page
    $('document').ready(function () {
      $.ajax({
        url: 'harness',
        dataType: 'json',
        success: api.loadtests,
        error: initError
      });
    });
  };

  api.getscratch = function () {
    return testscratch;
  };
})(Function('return this;')());

