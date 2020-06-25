import { Runner } from '../core/Runner';
import { TestData } from '../core/TestTypes';
import { Ui } from '../ui/Ui';
import { UrlParams } from '../core/UrlParams';
import { makeSessionId } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';

declare const $: JQueryStatic;

const Global: any = window;

// webpack makes this available
const globalTests: TestData[] = Global.__tests ? Global.__tests : [];

const params = UrlParams.parse(window.location.search, makeSessionId);
const ui = Ui($('body'));
const callbacks = Callbacks();
const reporter = Reporter(params, callbacks, ui);

const runner = Runner(globalTests, params, callbacks, reporter, ui);
runner.init((data) => {
  if (data.mode === 'auto') {
    // Try to ensure the page has focus
    window.focus();
  }
  runner.run(data.chunk, data.retries, data.timeout, data.stopOnFailure);
}, ui.error);
