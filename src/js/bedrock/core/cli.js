var factor = 100000000000;

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
    failed: '.test.failed',
    results: 'textarea.results',
    basedir: directories.bin + '/../'
  };
};

module.exports = {
  extract: extract
};