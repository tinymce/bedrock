import XMLWriter = require('xml-writer');
import * as fs from 'fs';
import { TestResults, TestResult } from '../server/Controller';
import { Attempt } from './Attempt';

export interface ReporterSettings {
  readonly name: string;
  readonly output: string;
}

const outputTime = (runnerTime: string) => {
  // runner adds 's' to the time for human readability, but junit needs just a float value in seconds
  const time = runnerTime;
  return time.charAt(time.length - 1) === 's' ? time.substr(0, time.length - 2) : time;
};

/**
 * XML has no way of "escaping" the CDATA end token ("]]>"), so we split into several CDATA sections
 * in the middle of this token. Jenkins seems fine with multiple CDATA sections within a <failure> tag.
 * @param s
 */
export const splitCdatas = (s: string): string[] => {
  const raw = s.split(/]]>/g);
  return raw.map((x, i) => {
    let r = '';
    if (i > 0) r = '>' + r;
    r = r + x;
    if (i < raw.length - 1) r = r + ']]';
    return r;
  });
};

export const write = (settings: ReporterSettings, data: TestResults): Attempt<string[], TestResult[]> => {
  const results = data.results;
  const time = (data.now - data.start) / 1000;
  const skipped = results.filter((result) => {
    return result.passed !== true && result.skipped;
  });
  const failed = results.filter((result) => {
    return result.passed !== true && !result.skipped;
  });

  /*
  We need to NOT indent.
  Yes, it would make the output prettier... but...
  There's a situation where the test failure contains a CDATA end token ("]]>").
  XML has no way of escaping this, so we have to break each of these into "]]" and ">" in separate CDATA sections.
  We need these CDATA sections to be immediately beside each other, otherwise any indent whitespace is
  displayed in the Jenkins test results.

  As of Bedrock 8, we have errors printed to system error, so the xml file should be read by humans less often,
  so the lack of pretty-printing should be tolerable.

  An alternative would be to replace the XMLWriter with one that pretty-prints everything EXCEPT adjacent CDATA sections.
   */
  const w = new XMLWriter(false);
  w.startDocument();

  const root = w.startElement('testsuites')
    .writeAttribute('tests', results.length)
    .writeAttribute('failures', failed.length)
    .writeAttribute('time', time)
    .writeAttribute('errors', 0);

  const suite = w.startElement('testsuite')
    .writeAttribute('tests', results.length)
    .writeAttribute('name', settings.name)
    .writeAttribute('host', 'localhost')
    .writeAttribute('id', 0)
    .writeAttribute('failures', failed.length)
    .writeAttribute('skipped', skipped.length)
    .writeAttribute('timestamp', data.start)
    .writeAttribute('time', time);

  results.forEach((res) => {
    const elem = w.startElement('testcase')
      .writeAttribute('name', res.file)
      .writeAttribute('classname', settings.name + '.' + res.name)
      .writeAttribute('time', outputTime(res.time));

    if (res.passed !== true) {
      if (res.skipped) {
        elem.startElement('skipped')
          .writeAttribute('message', res.skipped);
        elem.endElement();
      } else {
        elem.startElement('failure')
          .writeAttribute('Test FAILED: some failed assert')
          .writeAttribute('type', 'failure');
        const cdatas = splitCdatas(res.error?.text ?? '');
        cdatas.forEach((c) => elem.writeCData(c));
        elem.endElement();
      }
    }
    elem.endElement();
  });
  suite.endElement();

  root.endElement();

  try {
    fs.accessSync(settings.output);
  } catch (err) {
    fs.mkdirSync(settings.output);
  }

  const reportFile = settings.output + '/TEST-' + settings.name + '.xml';
  fs.writeFileSync(reportFile, w.toString());

  if (failed.length > 0) {
    return Attempt.failed(['Some tests failed. See {' + reportFile + '} for details.']);
  } else {
    return Attempt.passed(results);
  }
};

export const writePollExit = async (settings: ReporterSettings, results: TestResults): Promise<Attempt<string[], TestResult[]>> => {
  try {
    write(settings, results);
  } catch (err) {
    console.error('Error writing report for polling exit condition');
    console.error(err);
    console.error(err.stack);
  }

  return Promise.reject(results.message);
};
