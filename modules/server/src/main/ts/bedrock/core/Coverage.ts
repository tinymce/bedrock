import * as fs from 'fs';
import * as path from 'path';

const coverageDataDir = 'scratch';

export const writeCoverageData = (data: Record<string, any>): void => {
  if (Object.keys(data).length > 0) {
    const coverageDataFilePath = path.join(coverageDataDir, 'coverage.json');

    console.log('Writing coverage data to: ' + coverageDataFilePath);

    if (!fs.existsSync(coverageDataDir)) {
      fs.mkdirSync(coverageDataDir);
    }

    fs.writeFileSync(coverageDataFilePath, JSON.stringify(data));
  }
};
