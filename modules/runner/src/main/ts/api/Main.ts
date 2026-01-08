import { Failure, Global } from '@ephox/bedrock-common';
import * as Globals from '../core/Globals.js';
import * as TestLoader from '../core/TestLoader.js';
import { UrlParams } from '../core/UrlParams.js';
import { makeSessionId } from '../core/Utils.js';
import { Callbacks } from '../reporter/Callbacks.js';
import { Reporter } from '../reporter/Reporter.js';
import { Runner } from '../runner/Runner.js';
import { loop } from '../runner/Utils.js';
import { Ui } from '../ui/Ui.js';

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
    // Run the tests if an error didn't occur during loading
    if (loadError !== undefined) {
      return Promise.reject(loadError);
    } else {
      const autoMode = data.mode === 'auto';
      if (autoMode) {
        // Try to ensure the page has focus
        window.focus();
      }
      return runner.run(data.chunk, data.retries, data.timeout, data.stopOnFailure, autoMode);
    }
  }).catch((e: Error) => {
    console.error('Unexpected error occurred', e);
    const err = Failure.prepFailure(e);
    ui.error(err);
    reporter.done(err);
  });
};

const run = () => setupAndRun();
const runError = (e: Error) => setupAndRun(Failure.prepFailure(e));

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
