import { Failure, Global } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import * as Globals from '../core/Globals';
import * as TestLoader from '../core/TestLoader';
import { UrlParams } from '../core/UrlParams';
import { makeSessionId } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { Runner } from '../runner/Runner';
import { loop } from '../runner/Utils';
import { Ui } from '../ui/Ui';

declare const $: JQueryStatic;

// Setup the globals
Globals.setup();

const setupAndRun = (loadError?: Error) => {
  const params = UrlParams.parse(window.location.search, makeSessionId);
  const ui = Ui($('body'));
  const callbacks = Callbacks();
  const reporter = Reporter(params, callbacks, ui);

  const runner = Runner(Globals.rootSuite(), params, callbacks, reporter, ui);
  runner.init().then((data) => {
    if (data.mode === 'auto') {
      // Try to ensure the page has focus
      window.focus();
    }

    // Run the tests if an error didn't occur during loading
    if (loadError !== undefined) {
      return Promise.reject(loadError);
    } else {
      return runner.run(data.chunk, data.retries, data.timeout, data.stopOnFailure);
    }
  }).catch((e: Error) => {
    console.error('Unexpected error occurred', e);
    const err = Failure.prepFailure(e);
    ui.error(err);
    reporter.done(err);
  });
};

const run = () => setupAndRun();
const runError = (e: Error) => setupAndRun(e);

const loadAndRun = (scripts: string[]) => {
  // Load the scripts and then run
  loop(scripts, TestLoader.load)
    .then(run, runError);
};

Global.bedrock = {
  loadAndRun,
  run,
  rootSuite: Globals.rootSuite()
};
