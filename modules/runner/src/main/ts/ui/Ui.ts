import { LoggedError, Reporter } from '@ephox/bedrock-common';
import { ReporterUi } from '../reporter/Reporter';

export interface Ui extends ReporterUi {
  showRetry: () => void;
  hideRetry: () => void;
  showSkip: () => void;
  hideSkip: () => void;
  render: (offset: number, totalNumTests: number, onRestart: () => void, onRetry: () => void, onSkip: () => void) => void;
  error: (e: any) => void;
  setStopOnFailure: (stopOnFailure: boolean) => void;
}

declare const $: JQueryStatic;

export const Ui = (container: JQuery<HTMLElement>): Ui => {
  let stopOnFailure = false;
  let current: JQuery<HTMLElement>;
  let restartBtn: JQuery<HTMLElement>;
  let retryBtn: JQuery<HTMLElement>;
  let skipBtn: JQuery<HTMLElement>;

  const render = (offset: number, totalNumTests: number, onRestart: () => void, onRetry: () => void, onSkip: () => void) => {
    current = $('<span />').addClass('progress').text(offset);
    restartBtn = $('<button />').text('Restart').on('click', onRestart);
    retryBtn = $('<button />').text('Retry').on('click', onRetry).hide();
    skipBtn = $('<button />').text('Skip').on('click', onSkip).hide();

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
  };

  const done = (totalTime: string) => {
    container.append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
    $('.passed.hidden').removeClass('hidden');
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
      container.append(el);
    };

    const pass = (testTime: string, currentCount: number) => {
      el.removeClass('running').addClass('passed').addClass('hidden');
      marker.text('[passed]').addClass('passed');
      time.text(testTime);
      current.text(currentCount);
    };

    const fail = (e: LoggedError.LoggedError, testTime: string, currentCount: number) => {
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
      fail
    }
  };

  const error = (e: any) => {
    container.append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
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
  }
};