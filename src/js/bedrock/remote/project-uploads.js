var uploadtypes = require('./upload-types');

var getManyDirectories = function (settings, projectDirs) {
  return projectDirs.map(function (d) {
    return uploadtypes.dirtype(settings.projectdir + '/' + d, 'project/' + d);
  });
};

var getAllDirectories = function (settings) {
  return [
    uploadtypes.dirtype(settings.projectdir, 'project')
  ];
};

var choose = function (name, projectDirs, settings) {
  var link = function (inputDir, inputName, outputDir, outputName) {
    // TODO: use path.join?
    return uploadtypes.filetype(settings.basedir + inputDir + '/' + inputName, outputDir + '/' + outputName);
  };

  var boltlink = function (filename) {
    return link('node_modules/@ephox/bolt/lib', filename, 'lib/bolt', filename);
  };

  var getDirectories = function () {
    var useAll = projectDirs.length === 1 && projectDirs[0] === "*";
    return useAll ? getAllDirectories(settings) : getManyDirectories(settings, projectDirs);
  };

  return {
    bucket: 'tbio-testing',
    name: name,
    directories: getDirectories(),
    fileset: getDirectories().concat([

      link('src/resources', 'runner.js', 'js', 'runner.js'),
      boltlink('kernel.js'),
      boltlink('loader.js'),
      boltlink('module.js'),
      boltlink('test.js'),
      link('node_modules/jquery/dist', 'jquery.min.js', 'lib/jquery', 'jquery.min.js'),
      uploadtypes.filetype(settings.basedir + 'src/resources/bedrock.html', 'index.html'),
      uploadtypes.filetype(settings.basedir + 'src/css/bedrock.css', 'css/bedrock.css'),
      uploadtypes.datatype('harness', JSON.stringify({ config: settings.config, scripts: settings.testfiles }))
    ])
  };
};

module.exports = {
  choose: choose
};
