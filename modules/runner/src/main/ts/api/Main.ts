import { Global } from '@ephox/bedrock-common';
import * as Patches from '../core/Patches';
import { UrlParams } from '../core/UrlParams';
import { makeSessionId } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { Runner } from '../runner/Runner';
import { Ui } from '../ui/Ui';

declare const $: JQueryStatic;

// Setup mocha, which will bind the various global test functions
mocha.setup('bdd');

// Apply patches immediately, so that any calls to the globals use the patched version
Patches.patchMocha();

const run = () => {
  const params = UrlParams.parse(window.location.search, makeSessionId);
  const ui = Ui($('body'));
  const callbacks = Callbacks();
  const reporter = Reporter(params, callbacks, ui);

  const runner = Runner(params, callbacks, reporter, ui);
  runner.init().then((data) => {
    if (data.mode === 'auto') {
      // Try to ensure the page has focus
      window.focus();
    }
    runner.run(data.chunk, data.retries, data.timeout, data.stopOnFailure);
  }, ui.error);
};

Global.bedrock = {
  run
};
