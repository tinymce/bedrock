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
    // TODO: use path.join
    basedir: directories.bin + '/../'
  };
};

module.exports = {
  extract: extract
};
