import * as JsDiff from 'diff';
import { ArrayChange } from 'diff';
import { htmlentities } from './StringUtils';

// Note: `expected` is the baseline (the "old" side of the diff) and `actual` is the
// "new" side, so removals are what the test expected and additions are what it got.
export const diffPrettyHtml = (expected: string, actual: string): string => {
  const changes: ArrayChange<string>[] = JsDiff.diffArrays(expected.split('\n'), actual.split('\n'));
  const lines = changes.map((c) => {
    const prefix = (c.removed ? '<del style="background:#ffe6e6;">' : c.added ? '<ins style="background:#e6ffe6;">' : '<span>');
    const suffix = (c.removed ? '</del>' : c.added ? '</ins>' : '</span>');
    const texts = c.value;
    const tz = texts.map((t) => prefix + htmlentities(t) + suffix + '<br />');
    return tz.join('');
  });
  return lines.join('');
};

export const diffPrettyText = (expected: string, actual: string): string => {
  const changes: ArrayChange<string>[] = JsDiff.diffArrays(expected.split('\n'), actual.split('\n'));
  const lines = changes.map((c) => {
    const prefix = (c.removed ? '-' : c.added ? '+' : ' ') + ' | ';
    const texts = c.value;
    return prefix + texts.join('\n' + prefix);
  });
  return lines.join('\n');
};
