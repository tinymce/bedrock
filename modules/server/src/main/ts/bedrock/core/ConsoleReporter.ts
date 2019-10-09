import { TestResults } from '../server/Controller';

const numberOfErrorsToPrint = 5;

export const generateReport = (data: TestResults): string => {
  
  const results = data.results;
  const failures = results.filter((x) => !x.passed);

  if (failures.length > 0) {
    const r = [];
    const toShow = failures.slice(0, numberOfErrorsToPrint);
    const line = '-------------------------------------------------------------------------------';
    toShow.forEach((f) => {
      r.push(line);
      r.push(`Test failed: ${f.name} (${f.file})`);
      r.push(f.error);
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
