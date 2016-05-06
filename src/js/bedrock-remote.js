var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  
  var settings = cli.extract(directories);
  var uploader = require('./bedrock/remote/uploader');

  var link = function (inputDir, inputName, outputDir, outputName) {
    return { input: settings.basedir + inputDir + '/' + inputName, output: outputDir + '/' + outputName };
  };

  var boltlink = function (filename) {
    return link('node_modules/@ephox/bolt/lib', filename, 'lib/bolt', filename);
  };

  // {
  //     config: settings.config,
  //     scripts: settings.testfiles
  //   }

  uploader.upload({
    bucket: 'tbio-testing',
    name: 'hack',
    directories: [
      { prefix: 'project', base: settings.projectdir }
    ],
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
  }).then(function () {
    console.log('Success!');
  }, function (err) {
    console.error('Error', err, err.stack);
  });

  // var randomFolder = EXPIRY_SUBFOLDER + project.getCanonicalFile.getName + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date)
 //  var fallback = routes.constant(settings.basedir, 'src/resources/tunic.html');

  // TODO: Change to remote driver.
  // var driver = require('./bedrock/auto/driver').create({
  //   browser: 'chrome'
  // });



  // var serve = require('./bedrock/server/serve');

  // var cli = require('./bedrock/core/cli');
  // var poll = require('./bedrock/poll/poll');

  // var settings = cli.extract(directories);

  // var serveSettings = {
  //   projectdir: settings.projectdir,
  //   basedir: settings.basedir,
  //   config: settings.config,
  //   testfiles: settings.testfiles,
  //   driver: driver
  // };

  // serve.start(serveSettings, function (service, done) {
  //   console.log('started on port: ', service.port);

  //   driver.get('http://localhost:' + service.port);

  //   poll.loop(driver, settings).then(function (result) {
  //     driver.sleep(1000);

  //     driver.quit().then(function () {
  //       done();
  //     });
        
  //   }, function (err) {
  //     driver.sleep(1000);

  //     driver.quit().then(function () {
  //       done();
  //       throw err;
  //     });
  //   });
  // });
};


module.exports = {
  run: run
};
