import { RootSuite } from '../core/TestTypes';
import { UrlParams } from '../core/UrlParams';
import { makeSessionId } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { Runner } from '../runner/Runner';
import { Ui } from '../ui/Ui';

declare const $: JQueryStatic;

const Global: any = window;

// webpack makes this available
const globalSuites: RootSuite[] = Global.__suites ? Global.__suites : [];

const params = UrlParams.parse(window.location.search, makeSessionId);
const ui = Ui($('body'));
const callbacks = Callbacks();
const reporter = Reporter(params, callbacks, ui);

const runner = Runner(globalSuites, params, callbacks, reporter, ui);
runner.init((data) => {
  if (data.mode === 'auto') {
    // Try to ensure the page has focus
    window.focus();
  }
  runner.run(data.chunk, data.retries, data.timeout, data.stopOnFailure);
}, ui.error);
