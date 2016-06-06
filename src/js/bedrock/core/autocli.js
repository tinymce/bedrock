var cli = require('./cli.js');
var cloptions = require('./cloptions.js');

var extract = function (directories) {
  return cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it.',
    directories, [
      cloptions.browser,
      cloptions.name,
      cloptions.output
    ]
  );
};

module.exports = {
  extract: extract
};