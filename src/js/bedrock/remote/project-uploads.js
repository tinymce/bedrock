var choose = function (name, projectDirs, settings) {
  var link = function (inputDir, inputName, outputDir, outputName) {
    return { input: settings.basedir + inputDir + '/' + inputName, output: outputDir + '/' + outputName };
  };

  var boltlink = function (filename) {
    return link('node_modules/@ephox/bolt/lib', filename, 'lib/bolt', filename);
  };

  var getDirectories = function () {
    if (projectDirs.length === 1 && projectDirs[0] === "*") return [ { prefix: 'project', base: settings.projectdir } ];
    else return projectDirs.map(function (d) {
      return { prefix: 'project/' + d, base: settings.projectdir + '/' + d };
    });
  };

  return {
    bucket: 'tbio-testing',
    name: name,
    directories: getDirectories(),
    files: [
      link('src/resources', 'runner.js', 'js', 'runner.js'),
      { input: settings.basedir + 'src/resources/tunic.html', output: 'index.html' },
      boltlink('kernel.js'),
      boltlink('loader.js'),
      boltlink('module.js'),
      boltlink('test.js'),
      link('node_modules/jquery/dist', 'jquery.min.js', 'lib/jquery', 'jquery.min.js'),
      { input: settings.basedir + 'src/css/tunic.css', output: 'css/tunic.css' },
      link('src/css', 'tunic.css', 'css', 'tunic.css')
    ],
    inline: [
      { body: JSON.stringify({ config: settings.config, scripts: settings.testfiles }), output: 'harness' }
    ]
  };
};

module.exports = {
  choose: choose
};