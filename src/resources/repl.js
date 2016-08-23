/*global ephox */
/*jshint jquery:true */
(function (global) {
  global.ephox = global.ephox || {};
  global.ephox.bedrock = global.ephox.bedrock || {};
  var api = global.ephox.bedrock;


  api.runRepl = function () {
    $.ajax({
      url: 'repl',
      dataType: 'json',
      success: function (response) {
        console.log('REPL loaded ...', response);


        var install = ephox.bolt.module.bootstrap.install;
        var builtins = ephox.bolt.module.config.builtins.browser;
        var load = ephox.bolt.loader.transporter.xhr.request;
        var loadscript = ephox.bolt.loader.api.scripttag.load;

        var reader = function (done) {
          ephox.bolt.module.reader.browser.read('./', 'project/' + response.config, done);
        };

        install.install(reader, builtins, load, loadscript);

        var global = Function('return this;')();

        global.define = ephox.bolt.module.api.define;
        global.require = ephox.bolt.module.api.require;
        global.demand = ephox.bolt.module.api.demand;

        var repl = response.repl;

        require(repl.entries, function () {
          console.log('Module loaded ...');

          for (var mod in repl.aliases) {
            var alias = repl.aliases[mod];
            global[alias] = demand(mod);
            console.log('Loaded alias (' + alias + ') for ' + mod);
          }
        });
      },
      error: function (err ) {
        console.error('REPL failed', err);
        throw new Error(err);
      }
    });
  };
})(Function('return this;')());