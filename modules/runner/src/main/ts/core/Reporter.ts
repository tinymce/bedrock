import { LoggedError, Reporter } from '@ephox/bedrock-common';
import { Callbacks, onSuccessCallback } from './Callbacks';
import { UrlParams } from './UrlParams';
import { formatElapsedTime, makeUrl } from './Utils';

export interface TestReporter {
  start: (onDone: onSuccessCallback) => void;
  pass: (onDone: onSuccessCallback) => void;
  fail: (e: LoggedError.LoggedError, onDone: onSuccessCallback) => void;
}

export interface Reporter {
  summary: () => { passed: number; failed: number };
  test: (file: string, name: string) => TestReporter;
  done: () => void;
  setStopOnFailure: (stopOnFailure: boolean) => void;
  shouldStopOnFailure: () => boolean;
}

declare const $: JQueryStatic;

const elapsed = (since: Date): string => formatElapsedTime(since, new Date());

export const dom = (container: JQuery<HTMLElement>, totalNumTests: number, params: UrlParams, callbacks: Callbacks): Reporter => {
  const initial = new Date();
  let passCount = 0;
  let failCount = 0;
  let stopOnFailure = false;

  const summary = () => ({
    passed: passCount + (params.offset - params.failed),
    failed: failCount + params.failed,
  });

  const current = $('<span />').addClass('progress').text(params.offset);
  const restartBtn = $('<button />').text('Restart').on('click', () => {
    const url = makeUrl('', 0, 0, 0);
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
    container
      .append($('<div />')
        .append($('<span />').text('Suite progress: '))
        .append(current)
        .append($('<span />').text('/'))
        .append($('<span />').text(totalNumTests))
        .append('&nbsp;&nbsp;&nbsp;')
        .append(restartBtn)
        .append('&nbsp;&nbsp;&nbsp;')
        .append(retryBtn)
        .append('&nbsp;&nbsp;&nbsp;')
        .append(skipBtn)
      );
  });

  const test = (file: string, name: string) => {
    let starttime: Date;
    let el: JQuery<HTMLElement>;
    let output: JQuery<HTMLElement>;
    let marker: JQuery<HTMLSpanElement>;
    let testfile: JQuery<HTMLSpanElement>;
    let nameSpan: JQuery<HTMLSpanElement>;
    let error: JQuery<HTMLSpanElement>;
    let time: JQuery<HTMLSpanElement>;
    let reported: boolean;

    const start = (onDone: onSuccessCallback): void => {
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
      callbacks.sendTestStart(params.session, totalNumTests, file, name, onDone, onDone);
    };

    const pass = (onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      passCount++;
      el.removeClass('running').addClass('passed').addClass('hidden');
      marker.text('[passed]').addClass('passed');
      const testTime = elapsed(starttime);
      time.text(testTime);
      current.text(params.offset + passCount + failCount);
      callbacks.sendTestResult(params.session, file, name, true, testTime, null, onDone, onDone);
    };

    const fail = (e: LoggedError.LoggedError, onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      failCount++;
      el.removeClass('running').addClass('failed');
      marker.text('[failed]').addClass('failed');
      // Don't use .text() as it strips out newlines in IE, even when used
      // on a pre tag.
      const htmlError = Reporter.html(e);
      const textError = Reporter.text(e);
      const pre = $('<pre/>')
        .addClass('error')
        .html(htmlError);
      error.append(pre);
      const testTime = elapsed(starttime);
      time.text(testTime);
      current.text(params.offset + passCount + failCount);
      if (stopOnFailure) {
        current.text('\u274c @ ' + current.text());
        retryBtn.show();
        skipBtn.show();
      }
      callbacks.sendTestResult(params.session, file, name, false, testTime, textError, onDone, onDone);
    };

    return {
      start,
      pass,
      fail
    };
  };

  const done = (): void => {
    const setAsDone = (): void => {
      const totalTime = elapsed(initial);
      $('body').append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
      $('.passed.hidden').removeClass('hidden');
    };

    callbacks.sendDone(params.session, setAsDone, setAsDone);
  };

  const setStopOnFailure = (flag: boolean): void => {
    stopOnFailure = flag;
  };

  const shouldStopOnFailure = (): boolean => stopOnFailure;

  return {
    summary,
    test,
    done,
    setStopOnFailure,
    shouldStopOnFailure
  };
};