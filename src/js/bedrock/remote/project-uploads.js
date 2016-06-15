var uploadtypes = require('./upload-types');
var path = require('path');

var getManyDirectories = function (projectdir, uploaddirs) {
  return uploaddirs.map(function (d) {
    return uploadtypes.dirtype(projectdir + '/' + d, 'project/' + d);
  });
};

var getAllDirectories = function (projectdir) {
  return [
    uploadtypes.dirtype(projectdir, 'project')
  ];
};

var choose = function (settings) {
  var projectdir = settings.projectdir;
  var basedir = settings.basedir;
  var uploaddirs = settings.uploaddirs;

  var link = function (inputDir, inputName, outputDir, outputName) {
    // TODO: use path.join?
    return uploadtypes.filetype(path.join(basedir, inputDir, inputName), path.join(outputDir, outputName));
  };

  var boltlink = function (filename) {
    return link('node_modules/@ephox/bolt/lib', filename, 'lib/bolt', filename);
  };

  var getDirectories = function () {
    var useAll = uploaddirs.length === 1 && uploaddirs[0] === '*';
    return useAll ? getAllDirectories(projectdir) : getManyDirectories(projectdir, uploaddirs);
  };

  // TODO: Consider supporting other frameworks for uploading.
  return getDirectories().concat([
    link(
      path.join('src', 'resources'),
      'runner.js',
      'js',
      'runner.js'
    ),
    boltlink('kernel.js'),
    boltlink('loader.js'),
    boltlink('module.js'),
    boltlink('test.js'),
    link(
      path.join('node_modules', 'jquery', 'dist'),
      'jquery.min.js',
      path.join('lib', 'jquery'),
      'jquery.min.js'
    ),
    uploadtypes.filetype(
      path.join(basedir, 'src', 'resources', 'bedrock.html'),
      'index.html'
    ),
    uploadtypes.filetype(
      path.join(basedir, 'src', 'css', 'bedrock.css'),
      path.join('css', 'bedrock.css')
    ),
    uploadtypes.datatype('harness', JSON.stringify({ config: settings.config, scripts: settings.testfiles }))
  ]);
};

module.exports = {
  choose: choose
};
