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
  var stopOnFailure = settings.stopOnFailure;

  var link = function (inputDir, inputName, outputDir, outputName) {
    return uploadtypes.filetype(path.join(basedir, inputDir, inputName), path.join(outputDir, outputName));
  };

  var npmlink = function (pkg) {
    return path.dirname(path.relative(basedir, require.resolve(pkg)));
  };

  var boltlink = function (filename) {
    var inputDir = path.join(npmlink('@ephox/bolt'), '../lib');
    return link(inputDir, filename, 'lib/bolt', filename);
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
      npmlink('jquery'),
      'jquery.min.js',
      path.join('lib', 'jquery'),
      'jquery.min.js'
    ),
    uploadtypes.filetype(
      // NOTE: Uploading should never need phantom
      path.join(basedir, 'src', 'resources', 'bedrock.html'),
      'index.html'
    ),
    uploadtypes.filetype(
      path.join(basedir, 'src', 'css', 'bedrock.css'),
      path.join('css', 'bedrock.css')
    ),
    uploadtypes.datatype('harness', JSON.stringify({ config: settings.config, scripts: settings.testfiles, stopOnFailure: settings.stopOnFailure }))
  ]);
};

module.exports = {
  choose: choose
};
