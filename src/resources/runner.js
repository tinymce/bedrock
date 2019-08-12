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
  var timeout; // set during loadtests
  var testscratch = null; // set per test, private dom scratch area for the current test to use.
  var globalTests = global.__tests ? global.__tests : [];

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
      totalTests: globalTests.length,
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
    var restartBtn = $('<button />').text('Restart').click(function () {
      var url = makeUrl(null, 0, 0, 0);
      window.location.assign(url);
    });
    var retryBtn = $('<button />').text('Retry').click(function () {
      var sum = summary();
      var url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
      window.location.assign(url);
    }).hide();
    var skipBtn = $('<button />').text('Skip').click(function () {
      var sum = summary();
      var url = makeUrl(params.session, sum.passed + sum.failed, sum.failed, 0);
      window.location.assign(url);
    }).hide();

    $('document').ready(function () {
      $('body')
        .append($('<div />')
        .append($('<span />').text('Suite progress: '))
        .append(current)
        .append($('<span />').text('/'))
        .append($('<span />').text(globalTests.length))
        .append('&nbsp;&nbsp;&nbsp;')
        .append(restartBtn)
        .append('&nbsp;&nbsp;&nbsp;')
        .append(retryBtn)
        .append('&nbsp;&nbsp;&nbsp;')
        .append(skipBtn)
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

    var elapsed = function (since) {
      var end = new Date();
      var millis = end - since;
      var seconds = Math.floor(millis / 1000);
      var point = Math.floor(millis - (seconds * 1000) / 100);
      var printable =
        point < 10 ? '00' + point :
              point < 100 ? '0' + point :
                            '' + point;
      return seconds + '.' + printable + 's';
    };

    var test = function (file, name) {
      var starttime, el, output, marker, testfile, nameSpan, error, time, scratch, reported;

      var start = function (onDone) {
        starttime = new Date();
        el = $('<div />').addClass('test running');

        output = $('<div />').addClass('output');
        marker = $('<span />').text('[running]').addClass('result');
        testfile = $('<span />').text(file).addClass('testfile');
        nameSpan = $('<span />').text(name).addClass('name');
        error = $('<span />').addClass('error-container');
        time = $('<span />').addClass('time');
        output.append(marker, ' ', nameSpan, ' [', time, '] ', error, ' ', testfile);
        scratch = $('<div />').addClass('scratch');
        el.append(output, scratch);
        $('body').append(el);

        reported = false;
        testscratch = scratch.get(0);  // intentional, see top of file for var decl.
        sendTestStart(params.session, file, name, onDone, onDone);
      };

      var pass = function (onDone) {
        if (reported) return;
        reported = true;
        passCount++;
        el.removeClass('running').addClass('passed').addClass('hidden');
        marker.text('[passed]').addClass('passed');
        var testTime = elapsed(starttime);
        time.text(testTime);
        current.text(params.offset + passCount + failCount);
        sendTestResult(params.session, file, name, true, testTime, null, onDone, onDone);
      };

      var fail = function (e, onDone) {
        if (reported) return;
        reported = true;
        failCount++;
        el.removeClass('running').addClass('failed');
        marker.text('[failed]').addClass('failed');
        // Don't use .text() as it strips out newlines in IE, even when used
        // on a pre tag.
        var errorMessage = clean(e);
        var pre = $('<pre/>')
          .addClass('error')
          .html(errorMessage);
        error.append(pre);
        var testTime = elapsed(starttime);
        time.text(testTime);
        current.text(params.offset + passCount + failCount);
        if (stopOnFailure) {
          current.text('\u274c @ ' + current.text());
          retryBtn.show();
          skipBtn.show();
        }
        sendTestResult(params.session, file, name, false, testTime, errorMessage, onDone, onDone);
      };

      return {
        start: start,
        pass: pass,
        fail: fail
      };
    };

    var done = function () {
      var setAsDone = function () {
        var totalTime = elapsed(initial);
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

  var formatExtra = function (e) {
    if (!e.logs) {
      if (!e.stack) {
        return '';
      } else {
        var lines = e.stack.split('\n').filter(function (line) {
          return line.indexOf('at') !== -1;
        });
        return '\n\nStack:\n' + lines.join('\n');
      }
    } else {
      var lines = e.logs.map(function(log) {
        var noNewLines = log.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        return noNewLines;
      });
      return '\n\nLogs:\n' + lines.join('\n');
    }
  };

  var clean = function (err) {
    var e = err === undefined ? new Error('no error given') : err;

    if (typeof e === 'string') {
      return e;
    }
    var extra = formatExtra(e);
    if (e.diff !== undefined) {
      // Provide detailed HTML comparison information
      return 'Test failure: ' + e.message +
        '\nExpected: ' + htmlentities(e.diff.expected) +
        '\nActual: ' + htmlentities(e.diff.actual) +
        '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison)) +
        extra;
    }
    if (e.name === 'AssertionError') {
      return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
      ': [' + htmlentities(JSON.stringify(e.expected)) + '] ' + e.operator +
      ' [' + htmlentities(JSON.stringify(e.actual)) + ']' + extra;
    }
    if (e.name && e.message) {
      return htmlentities(e.name + ': ' + e.message + extra);
    }
    if (e.toString) {
      return htmlentities(String(e) + extra);
    }
    return htmlentities(JSON.stringify(e) + extra);
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
        var timer = setTimeout(function() {
          report.fail('Test ran too long', afterFail);
        }, timeout);
        try {
          report.start(function () {
            test.test(function () {
              clearTimeout(timer);
              report.pass(function () {
                if (params.retry > 0) {
                  params.retry = 0;
                  var url = makeUrl(params.session, params.offset, params.failed, params.retry);
                  window.history.pushState({}, '', url);
                }
                loop(tests);
              });
            }, function (e) {
              clearTimeout(timer);
              console.error(e);
              report.fail(e, afterFail);
            });
          });
        } catch (e) {
          clearTimeout(timer);
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
    timeout = data.timeout;
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

