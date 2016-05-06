var run = function (settings) {
  var http = require('http');
  var finalhandler = require('finalhandler');

  var openport = require('openport');

  var routes = require('./bedrock/route/routes');  
  var exits = require('./bedrock/loop/exits');
  var keys = require('./bedrock/effects/keys');
  var state = require('./bedrock/loop/state');
  var auto = require('./bedrock-auto');

  var routers = [
    routes.routing('/project', settings.projectdir),
    routes.routing('/js', settings.basedir + 'src/resources'),
    routes.routing('/lib/bolt', settings.basedir + 'node_modules/@ephox/bolt/lib'),
    routes.routing('/lib/jquery', settings.basedir + 'node_modules/jquery/dist'),
    routes.routing('/css', settings.basedir + 'src/css'),
    routes.json('/harness', {
      config: settings.config,
      scripts: settings.testfiles
    }),
    routes.effect('/keys', keys.executor(driver))
  ];

  var fallback = routes.constant(settings.basedir, 'src/resources/tunic.html');

  openport.find({
    startingPort: 8000,
    endingPort: 20000
  }, function (err, port) {
    if (err) { console.log(err); return; }

    console.log('Starting bedrock server on http://localhost:' + port);

    var server = http.createServer(function (request, response) {
      var done = finalhandler(request, response);
      routes.route(routers, fallback, request, response, done);
    }).listen(port);

    auto.poll('http://localhost:' + port, function () {
      server.close();
    });
  }); 
};

module.exports = {
  run: run
};
