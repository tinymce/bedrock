import * as jQuery from 'jquery';

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

const urlParams = function () {
  const params = {};
  let qs = window.location.search;
  qs = qs.split('+').join(' ');
  const re = /[?&]?([^=]+)=([^&]*)/g;
  let m;
  while (m = re.exec(qs)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  return params;
};

const posInt = function (str) {
  if (typeof str === 'string') {
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  return 0;
};

const makeSessionId = function () {
  return '' + Math.ceil((Math.random() * 100000000));
};

const getParams = function () {
  const params = urlParams();
  return {
    session: params['session'] || makeSessionId(),
    offset: posInt(params['offset']),
    failed: posInt(params['failed']),
    retry: posInt(params['retry']),
  }
};

let chunk; // set during loadtests
let retries; // set during loadtests
let timeout; // set during loadtests
let testscratch = null; // set per test, private dom scratch area for the current test to use.
const globalTests = Global.__tests ? Global.__tests : [];

var params = getParams();

const makeUrl = function (session, offset, failed, retry) {
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  if (offset > 0) {
    const rt = (retry > 0 ? '&retry=' + retry : '');
    return baseUrl + '?session=' + session + '&offset=' + offset + '&failed=' + failed + rt;
  } else {
    return baseUrl;
  }
};

const sendJson = function (url, data, onSuccess, onError) {
  if (onSuccess === undefined) onSuccess = function () {
  };
  if (onError === undefined) onError = function () {
  };
  $.ajax({
    method: 'post',
    url: url,
    dataType: 'json',
    success: onSuccess,
    error: onError,
    data: JSON.stringify(data)
  });
};

const sendKeepAlive = function (session, onSuccess, onError) {
  sendJson('/tests/alive', {
    session: session
  }, onSuccess, onError);
};

const sendTestStart = function (session, file, name, onSuccess, onError) {
  sendJson('/tests/start', {
    totalTests: globalTests.length,
    session: session,
    file: file,
    name: name,
  }, onSuccess, onError);
};

const sendTestResult = function (session, file, name, passed, time, error, onSuccess, onError) {
  sendJson('/tests/result', {
    session: session,
    file: file,
    name: name,
    passed: passed,
    time: time,
    error: error
  }, onSuccess, onError);
};

const sendDone = function (session, onSuccess, onError) {
  const getCoverage = function () {
    return typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;
  };

  sendJson('/tests/done', {
    session: session,
    coverage: getCoverage()
  }, onSuccess, onError);
};

const reporter = (function () {
  const current = $('<span />').addClass('progress').text(params.offset);
  const restartBtn = $('<button />').text('Restart').click(function () {
    const url = makeUrl(null, 0, 0, 0);
    window.location.assign(url);
  });
  const retryBtn = $('<button />').text('Retry').click(function () {
    const sum = summary();
    const url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
    window.location.assign(url);
  }).hide();
  const skipBtn = $('<button />').text('Skip').click(function () {
    const sum = summary();
    const url = makeUrl(params.session, sum.passed + sum.failed, sum.failed, 0);
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

  const initial = new Date();
  const passCount = 0;
  const failCount = 0;

  const stopOnFailure = false;

  const keepAliveTimer = setInterval(function () {
    sendKeepAlive(params.session, undefined, function () {
      // if the server shutsdown stop trying to send messages
      clearInterval(keepAliveTimer);
    });
  }, 5000);

  var summary = function () {
    return {
      passed: passCount + (params.offset - params.failed),
      failed: failCount + params.failed,
    };
  };

  const elapsed = function (since: Date) {
    const end = new Date();
    const millis = end.getDate() - since.getDate();
    const seconds = Math.floor(millis / 1000);
    const point = Math.floor(millis - (seconds * 1000) / 100);
    const printable =
      point < 10 ? '00' + point :
        point < 100 ? '0' + point :
          '' + point;
    return seconds + '.' + printable + 's';
  };

  const test = function (file, name) {
    let starttime, el, output, marker, testfile, nameSpan, error, time, scratch, reported;

    const start = function (onDone) {
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

    const pass = function (onDone) {
      if (reported) return;
      reported = true;
      passCount++;
      el.removeClass('running').addClass('passed').addClass('hidden');
      marker.text('[passed]').addClass('passed');
      const testTime = elapsed(starttime);
      time.text(testTime);
      current.text(params.offset + passCount + failCount);
      sendTestResult(params.session, file, name, true, testTime, null, onDone, onDone);
    };

    const fail = function (e, onDone) {
      if (reported) return;
      reported = true;
      failCount++;
      el.removeClass('running').addClass('failed');
      marker.text('[failed]').addClass('failed');
      // Don't use .text() as it strips out newlines in IE, even when used
      // on a pre tag.
      const errorMessage = clean(e);
      const pre = $('<pre/>')
        .addClass('error')
        .html(errorMessage);
      error.append(pre);
      const testTime = elapsed(starttime);
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

  const done = function () {
    const setAsDone = function () {
      const totalTime = elapsed(initial);
      $('body').append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
      $('.passed.hidden').removeClass('hidden');
    };

    sendDone(params.session, setAsDone, setAsDone);
  };

  const setStopOnFailure = function (flag) {
    stopOnFailure = flag;
  };

  const shouldStopOnFailure = function () {
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

const htmlentities = function (str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const processQUnit = function (html) {
  // Required to make <del> and <ins> stay as tags.
  return html.replace(/&lt;del&gt;/g, '<del>').replace(/&lt;\/del&gt;/g, '</del>').replace(/&lt;ins&gt;/g, '<ins>').replace(/&lt;\/ins&gt;/g, '</ins>');
};

const formatExtra = function (e) {
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
    var lines = e.logs.map(function (log) {
      const noNewLines = log.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      return noNewLines;
    });
    return '\n\nLogs:\n' + lines.join('\n');
  }
};

var clean = function (err) {
  const e = err === undefined ? new Error('no error given') : err;

  if (typeof e === 'string') {
    return e;
  }
  const extra = formatExtra(e);
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

const initError = function (e) {
  $('body').append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
};

const runGlobalTests = function () {

  const loadNextChunk = function () {
    if (globalTests.length > (params.offset + chunk)) {
      const url = makeUrl(params.session, params.offset + chunk, reporter.summary().failed, 0);
      window.location.assign(url);
    } else {
      reporter.done();
      // for easy rerun reset the URL
      window.history.pushState({}, '', makeUrl(params.session, 0, 0, 0));
    }
  };

  const retryTest = function () {
    const sum = reporter.summary();
    window.location.assign(
      makeUrl(
        params.session,
        sum.passed + sum.failed - 1,
        sum.failed - 1,
        params.retry + 1
      )
    );
  };

  const loadNextTest = function () {
    const sum = reporter.summary();
    window.location.assign(
      makeUrl(
        params.session,
        sum.passed + sum.failed,
        sum.failed,
        0
      )
    );
  };

  const afterFail = function () {
    if (reporter.shouldStopOnFailure()) {
      reporter.done();
      // make it easy to restart at this test
      const sum = reporter.summary();
      const url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
      window.history.pushState({}, '', url);
    } else if (params.retry < retries) {
      retryTest();
    } else {
      loadNextTest();
    }
  };

  const loop = function (tests) {
    if (tests.length > 0) {
      const test = tests.shift();
      const report = reporter.test(test.filePath, test.name);
      const timer = setTimeout(function () {
        report.fail('Test ran too long', afterFail);
      }, timeout);
      try {
        report.start(function () {
          test.test(function () {
            clearTimeout(timer);
            report.pass(function () {
              if (params.retry > 0) {
                params.retry = 0;
                const url = makeUrl(params.session, params.offset, params.failed, params.retry);
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

const loadtests = function (data) {
  chunk = data.chunk;
  retries = data.retries;
  timeout = data.timeout;
  reporter.setStopOnFailure(data.stopOnFailure);
  runGlobalTests();
};

const testrunner = function () {
  // delay this ajax call until after the reporter status elements are in the page
  $('document').ready(function () {
    $.ajax({
      url: 'harness',
      dataType: 'json',
      success: loadtests,
      error: initError
    });
  });
};

const getscratch = function () {
  return testscratch;
};

testrunner();
