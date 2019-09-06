import { UrlParams } from './core/UrlParams';
import { AssertionError, HtmlDiffAssertionError, LoggedError, NormalizedTestError } from './alien/ErrorTypes';

declare const $: JQueryStatic;

// webpack makes this available
const Global: any = window;

const makeSessionId = (): string =>
  '' + Math.ceil((Math.random() * 100000000));

let chunk; // set during loadtests
let retries; // set during loadtests
let timeout; // set during loadtests
const globalTests = Global.__tests ? Global.__tests : [];

const params = UrlParams.parse(window.location.search, makeSessionId);

const makeUrl = (session, offset, failed, retry): string => {
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  if (offset > 0) {
    const rt = (retry > 0 ? '&retry=' + retry : '');
    return baseUrl + '?session=' + session + '&offset=' + offset + '&failed=' + failed + rt;
  } else {
    return baseUrl;
  }
};

const noop = (): void => {};

const sendJson = (url, data, onSuccess = noop, onError = noop): void => {
  // noinspection JSIgnoredPromiseFromCall
  $.ajax({
    method: 'post',
    url: url,
    dataType: 'json',
    success: onSuccess,
    error: onError,
    data: JSON.stringify(data),
  });
};

const sendKeepAlive = (session, onSuccess, onError): void => {
  sendJson('/tests/alive', {
    session: session,
  }, onSuccess, onError);
};

const sendTestStart = (session, file, name, onSuccess, onError): void => {
  sendJson('/tests/start', {
    totalTests: globalTests.length,
    session: session,
    file: file,
    name: name,
  }, onSuccess, onError);
};

const sendTestResult = (session, file, name, passed, time, error, onSuccess, onError): void => {
  sendJson('/tests/result', {
    session: session,
    file: file,
    name: name,
    passed: passed,
    time: time,
    error: error,
  }, onSuccess, onError);
};

const sendDone = (session, onSuccess, onError): void => {
  const getCoverage = (): any => typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;

  sendJson('/tests/done', {
    session: session,
    coverage: getCoverage(),
  }, onSuccess, onError);
};

const htmlentities = (str): string =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

const isHTMLDiffError = (err: NormalizedTestError): err is HtmlDiffAssertionError => {
  return err.name === 'HtmlAssertion';
};

const isAssertionError = (err: NormalizedTestError): err is AssertionError => {
  return err.name === 'AssertionError';
};

const formatExtra = (e: LoggedError): string => {
  if (!e.logs) {
    if (!e.error.stack) {
      return '';
    } else {
      const lines = e.error.stack.split('\n').filter((line) =>
        line.indexOf('at') !== -1);
      return '\n\nStack:\n' + lines.join('\n');
    }
  } else {
    const lines = e.logs.map((log) =>
      log.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    return '\n\nLogs:\n' + lines.join('\n');
  }
};

const clean = (err: LoggedError): string => {
  const e = err === undefined ? new Error('no error given') : err.error;

  const extra = formatExtra(err);
  if (isHTMLDiffError(e)) {
    // Provide detailed HTML comparison information
    return 'Test failure: ' + e.message +
      '\nExpected: ' + htmlentities(e.diff.expected) +
      '\nActual: ' + htmlentities(e.diff.actual) +
      '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison)) +
      extra;
  } else if (isAssertionError(e)) {
    return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
      ': [' + htmlentities(JSON.stringify(e.expected)) + '] ' + e.operator +
      ' [' + htmlentities(JSON.stringify(e.actual)) + ']' + extra;
  } else if (e.name && e.message) {
    return htmlentities(e.name + ': ' + e.message + extra);
  } else if (e.toString !== undefined) {
    return htmlentities(String(e) + extra);
  } else {
    return htmlentities(JSON.stringify(e) + extra);
  }
};

let passCount = 0;
let failCount = 0;

const summary = (): {passed: number; failed: number} => ({
  passed: passCount + (params.offset - params.failed),
  failed: failCount + params.failed,
});

const reporter = (() => {
  const current = $('<span />').addClass('progress').text(params.offset);
  const restartBtn = $('<button />').text('Restart').on('click', () => {
    const url = makeUrl(null, 0, 0, 0);
    window.location.assign(url);
  });
  const retryBtn = $('<button />').text('Retry').on('click', () => {
    const sum = summary();
    const url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
    window.location.assign(url);
  }).hide();
  const skipBtn = $('<button />').text('Skip').on('click', () => {
    const sum = summary();
    const url = makeUrl(params.session, sum.passed + sum.failed, sum.failed, 0);
    window.location.assign(url);
  }).hide();

  $(() => {
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
  let stopOnFailure = false;

  const keepAliveTimer = setInterval(() => {
    sendKeepAlive(params.session, undefined, () => {
      // if the server shutsdown stop trying to send messages
      clearInterval(keepAliveTimer);
    });
  }, 5000);

  const elapsed = (since: Date): string => {
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

  const test = (file, name) => {
    let starttime;
    let el;
    let output;
    let marker;
    let testfile;
    let nameSpan;
    let error;
    let time;
    let reported;

    const start = (onDone): void => {
      starttime = new Date();
      el = $('<div />').addClass('test running');

      output = $('<div />').addClass('output');
      marker = $('<span />').text('[running]').addClass('result');
      testfile = $('<span />').text(file).addClass('testfile');
      nameSpan = $('<span />').text(name).addClass('name');
      error = $('<span />').addClass('error-container');
      time = $('<span />').addClass('time');
      output.append(marker, ' ', nameSpan, ' [', time, '] ', error, ' ', testfile);
      el.append(output);
      $('body').append(el);

      reported = false;
      sendTestStart(params.session, file, name, onDone, onDone);
    };

    const pass = (onDone): void => {
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

    const fail = (e, onDone): void => {
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
      fail: fail,
    };
  };

  const done = (): void => {
    const setAsDone = (): void => {
      const totalTime = elapsed(initial);
      $('body').append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
      $('.passed.hidden').removeClass('hidden');
    };

    sendDone(params.session, setAsDone, setAsDone);
  };

  const setStopOnFailure = (flag): void => {
    stopOnFailure = flag;
  };

  const shouldStopOnFailure = (): boolean => stopOnFailure;

  return {
    summary: summary,
    test: test,
    done: done,
    setStopOnFailure: setStopOnFailure,
    shouldStopOnFailure: shouldStopOnFailure,
  };
})();

const initError = (e): void => {
  $('body').append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
};

const runGlobalTests = (): void => {
  const loadNextChunk = (): void => {
    if (globalTests.length > (params.offset + chunk)) {
      const url = makeUrl(params.session, params.offset + chunk, reporter.summary().failed, 0);
      window.location.assign(url);
    } else {
      reporter.done();
      // for easy rerun reset the URL
      window.history.pushState({}, '', makeUrl(params.session, 0, 0, 0));
    }
  };

  const retryTest = (): void => {
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

  const loadNextTest = (): void => {
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

  const afterFail = (): void => {
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

  const loop = (tests): void => {
    if (tests.length > 0) {
      const test = tests.shift();
      const report = reporter.test(test.filePath, test.name);
      const timer = setTimeout(() => {
        report.fail('Test ran too long', afterFail);
      }, timeout);
      try {
        report.start(() => {
          test.test(() => {
            clearTimeout(timer);
            report.pass(() => {
              if (params.retry > 0) {
                params.retry = 0;
                const url = makeUrl(params.session, params.offset, params.failed, params.retry);
                window.history.pushState({}, '', url);
              }
              loop(tests);
            });
          }, (e) => {
            clearTimeout(timer);
            console.error(e.error || e);
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

const loadtests = (data): void => {
  chunk = data.chunk;
  retries = data.retries;
  timeout = data.timeout;
  reporter.setStopOnFailure(data.stopOnFailure);
  runGlobalTests();
};

const testrunner = (): void => {
  // delay this ajax call until after the reporter status elements are in the page
  $((): void => {
    // noinspection JSIgnoredPromiseFromCall
    $.ajax({
      url: 'harness',
      dataType: 'json',
      success: loadtests,
      error: initError,
    });
  });
};

testrunner();
