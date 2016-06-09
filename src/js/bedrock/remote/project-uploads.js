var uploadtypes = require('./upload-types');

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

var choose = function (name, uploaddirs, basedir, projectdir, config, testfiles) {
  var link = function (inputDir, inputName, outputDir, outputName) {
    // TODO: use path.join?
    return uploadtypes.filetype(basedir + inputDir + '/' + inputName, outputDir + '/' + outputName);
  };

  var boltlink = function (filename) {
    return link('node_modules/@ephox/bolt/lib', filename, 'lib/bolt', filename);
  };

  var getDirectories = function () {
    var useAll = uploaddirs.length === 1 && uploaddirs[0] === "*";
    return useAll ? getAllDirectories(projectdir) : getManyDirectories(projectdir, uploaddirs);
  };

  return {
    bucket: 'tbio-testing',
    name: name,
    fileset: getDirectories().concat([

      link('src/resources', 'runner.js', 'js', 'runner.js'),
      boltlink('kernel.js'),
      boltlink('loader.js'),
      boltlink('module.js'),
      boltlink('test.js'),
      link('node_modules/jquery/dist', 'jquery.min.js', 'lib/jquery', 'jquery.min.js'),
      uploadtypes.filetype(basedir + 'src/resources/bedrock.html', 'index.html'),
      uploadtypes.filetype(basedir + 'src/css/bedrock.css', 'css/bedrock.css'),
      uploadtypes.datatype('harness', JSON.stringify({ config: config, scripts: testfiles }))
    ])
  };
};

module.exports = {
  choose: choose
};
