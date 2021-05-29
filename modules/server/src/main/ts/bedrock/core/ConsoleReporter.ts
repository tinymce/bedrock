import * as chalk from 'chalk';
import { highlight } from 'cli-highlight';
import { TestErrorData, TestResults } from '../server/Controller';

const numberOfErrorsToPrint = 5;

const highlightDiff = (diff: string) =>
  highlight(diff, { language: 'diff' });

const formatExtra = (err: TestErrorData): string => {
  const e = err.data;
  if (e.logs !== undefined && e.logs.length > 0) {
    return '\n\nLogs:\n' + chalk.gray(e.logs);
  } else if (e.stack !== undefined && e.stack.length > 0) {
    return '\n\nStack:\n' + chalk.gray(e.stack);
  } else {
    return '';
  }
};

const formatDiff = (actual: string, expected: string, comparison: string) => {
  return `Expected:
${expected}
Actual:
${actual}
Diff:
${highlightDiff(comparison)}`;
};

const formatError = (err: TestErrorData | null) => {
  if (err === null) {
    return '';
  } else {
    const data = err.data;
    const message = chalk.red(data.message);
    const diff = data.diff ? '\n' + formatDiff(data.diff.actual, data.diff.expected, data.diff.comparison) : '';
    const extra = formatExtra(err);
    return `${message}${diff}${extra}`;
  }
};

export const generateReport = (data: TestResults): string => {
  const results = data.results;
  const failures = results.filter((x) => !x.passed && !x.skipped);

  if (failures.length > 0) {
    const r = [];
    const toShow = failures.slice(0, numberOfErrorsToPrint);
    const line = '-------------------------------------------------------------------------------';
    toShow.forEach((f) => {
      r.push(line);
      r.push(`Test failed: ${f.name} (${f.file})`);
      r.push(formatError(f.error));
      r.push('');
    });
    r.push(line);

    if (failures.length > numberOfErrorsToPrint) {
      const remaining = failures.length - numberOfErrorsToPrint;
      r.push(`+ ${remaining} additional failure${remaining === 1 ? '' : 's'} not shown.`);
      r.push('');
    }
    return r.join('\n');
  } else {
    return '';
  }
};

export const printReport = (data: TestResults): void => {
  const message = generateReport(data);
  if (message !== '') {
    console.error(message);
  }
};
