var fs = require('fs');
var path = require('path');

var coverageDataDir = 'scratch';

var writeCoverageData = function (data) {
  if (Object.keys(data).length > 0) {
    var coverageDataFilePath = path.join(coverageDataDir, 'coverage.json');

    console.log('Writing coverage data to: ' + coverageDataFilePath);

    if (!fs.existsSync(coverageDataDir)) {
      fs.mkdirSync(coverageDataDir);
    }

    fs.writeFileSync(coverageDataFilePath, JSON.stringify(data));
  }
};

module.exports = {
  writeCoverageData: writeCoverageData
};
