import * as DMP from 'diff-match-patch';

// Parts of this file copied and modified from https://github.com/google/diff-match-patch

/**
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
export const diffPrettyHtml = (diffs: DMP.Diff[]) => {
  const html = [];
  const patternAmp = /&/g;
  const patternLt = /</g;
  const patternGt = />/g;
  const patternPara = /\n/g;
  for (let x = 0; x < diffs.length; x++) {
    const op = diffs[x][0];    // Operation (insert, delete, equal)
    const data = diffs[x][1];  // Text of change.
    const text = data.replace(patternAmp, '&amp;').replace(patternLt, '&lt;')
      .replace(patternGt, '&gt;').replace(patternPara, '<br/>');
    switch (op) {
    case DMP.DIFF_INSERT:
      html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
      break;
    case DMP.DIFF_DELETE:
      html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
      break;
    case DMP.DIFF_EQUAL:
      html[x] = '<span>' + text + '</span>';
      break;
    }
  }
  return html.join('');
};

export const diffLineMode = (text1: string, text2: string) => {
  const dmp = new DMP.diff_match_patch();
  const a = dmp.diff_linesToChars_(text1, text2);
  const lineText1 = a.chars1;
  const lineText2 = a.chars2;
  const lineArray = a.lineArray;
  const diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  return diffs;
};
