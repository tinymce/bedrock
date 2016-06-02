var path = require('path');
var factor = 1;

var extract = function (params, directories) {
  return {
    testfiles: params.testFiles,
    projectdir: directories.current,
    config: params.testConfig,
    overallTimeout: 10 * 60 * 1000 * factor,
    singleTimeout: 30 * 1000 * factor,
    done: 'div.done',
    progress: '.progress',
    total: '.total',
    testName: '.test.running .name',
    results: 'textarea.results',
    basedir: path.join(directories.bin, '/..'),
    pollDelay: 3000
  };
};

module.exports = {
  extract: extract
};
