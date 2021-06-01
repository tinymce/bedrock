import { LoggedError, Reporter } from '@ephox/bedrock-common';
import { ReporterUi } from '../reporter/Reporter';

type LoggedError = LoggedError.LoggedError;

export interface Ui extends ReporterUi {
  readonly showRetry: () => void;
  readonly hideRetry: () => void;
  readonly showSkip: () => void;
  readonly hideSkip: () => void;
  readonly render: (offset: number, totalNumTests: number, onRestart: () => void, onRetry: () => void, onSkip: () => void) => void;
  readonly error: (e: LoggedError) => void;
  readonly setStopOnFailure: (stopOnFailure: boolean) => void;
}

declare const $: JQueryStatic;

export const Ui = (container: JQuery<HTMLElement>): Ui => {
  let stopOnFailure = false;
  let ui: JQuery<HTMLElement>;
  let current: JQuery<HTMLElement>;
  let restartBtn: JQuery<HTMLElement>;
  let retryBtn: JQuery<HTMLElement>;
  let skipBtn: JQuery<HTMLElement>;

  const render = (offset: number, totalNumTests: number, onRestart: () => void, onRetry: () => void, onSkip: () => void) => {
    ui = $('<div></div>');
    current = $('<span />').addClass('progress').text(offset);
    restartBtn = $('<button />').text('Restart').on('click', onRestart);
    retryBtn = $('<button />').text('Retry').on('click', onRetry).hide();
    skipBtn = $('<button />').text('Skip').on('click', onSkip).hide();

    ui.append(
      $('<div />')
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
    container.append(ui);
  };

  const done = (totalTime: string) => {
    ui.append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
    $('.passed.hidden,.skipped.hidden').removeClass('hidden');
  };

  const test = () => {
    let el: JQuery<HTMLElement>;
    let marker: JQuery<HTMLSpanElement>;
    let errorContainer: JQuery<HTMLSpanElement>;
    let time: JQuery<HTMLSpanElement>;

    const start = (file: string, name: string) => {
      el = $('<div />').addClass('test running');

      const output = $('<div />').addClass('output');
      const testfile = $('<span />').text(file).addClass('testfile');
      const nameSpan = $('<span />').text(name).addClass('name');
      marker = $('<span />').text('[running]').addClass('result');
      errorContainer = $('<span />').addClass('error-container');
      time = $('<span />').addClass('time');
      output.append(marker, ' ', nameSpan, ' [', time, '] ', errorContainer, ' ', testfile);
      el.append(output);
      ui.append(el);
    };

    const pass = (testTime: string, currentCount: number) => {
      el.removeClass('running').addClass('passed').addClass('hidden');
      marker.text('[passed]').addClass('passed');
      time.text(testTime);
      current.text(currentCount);
    };

    const skip = (testTime: string, currentCount: number) => {
      el.removeClass('running').addClass('skipped').addClass('hidden');
      marker.text('[skipped]').addClass('skipped');
      time.text(testTime);
      current.text(currentCount);
    };

    const fail = (e: LoggedError, testTime: string, currentCount: number) => {
      el.removeClass('running').addClass('failed');
      marker.text('[failed]').addClass('failed');
      // Don't use .text() as it strips out newlines in IE, even when used
      // on a pre tag.
      const htmlError = Reporter.html(e);
      const pre = $('<pre/>')
        .addClass('error')
        .html(htmlError);
      errorContainer.append(pre);
      time.text(testTime);
      current.text(currentCount);
      if (stopOnFailure) {
        current.text('\u274c @ ' + current.text());
        retryBtn.show();
        skipBtn.show();
      }
    };

    return {
      start,
      pass,
      skip,
      fail
    };
  };

  const error = (error: LoggedError) => {
    const message = Reporter.html(error);
    ui.append(`<div class="failed"><pre>${message}</pre></div>`);
  };

  const setStopOnFailure = (flag: boolean): void => {
    stopOnFailure = flag;
  };

  return {
    render,
    test,
    error,
    done,
    hideSkip: () => skipBtn.hide(),
    showSkip: () => skipBtn.show(),
    hideRetry: () => retryBtn.show(),
    showRetry: () => retryBtn.show(),
    setStopOnFailure
  };
};