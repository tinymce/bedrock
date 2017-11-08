/*global ephox */
/*jshint jquery:true */
(function (global) {
  global.ephox = global.ephox || {};
  global.ephox.bedrock = global.ephox.bedrock || {};
  var api = global.ephox.bedrock;

  var testconfig = '';     // set during loadtests, for global config to use.
  var testcount = $('<span />').addClass('total').text(0);       // set during loadtests, for selenium remote test counting
  var testscratch = null;  // set per test, private dom scratch area for the current test to use.
  var globalTests = global.__tests ? global.__tests : [];
  var globalTestFiles = global.__testFiles ? global.__testFiles : [];

  var timer = ephox.bolt.test.report.timer;
  var accumulator = ephox.bolt.test.run.accumulator;
  var wrapper = ephox.bolt.test.run.wrapper;
  var errors = ephox.bolt.test.report.errors;

  globalTestFiles.forEach(function (filePath, i) {
    globalTests[i].filePath = filePath;
  });

  var sendJson = function (url, data, success, error) {
    $.ajax({
      method: 'post',
      url: url,
      dataType: 'json',
      success: success,
      error: error,
      data: JSON.stringify(data)
    });
  };

  var bedrocksource = function () {
    return {
      args: [ function (path) { return path; }, 'ephox.bedrock', 'js', function (id) { return id; } ],
      relativeTo: '',
      type: 'amd'
    };
  };

  var reader = function (done) {
    browser.read('./', 'project/' + testconfig, function (data) {
      data.sources = [ bedrocksource() ].concat(data.sources);
      done(data);
    });
  };

  var reporter = (function () {
    var current = $('<span />').addClass('progress').text(0);
    var stop = $('<button />').text('stop').click(function () { accumulator.cancel(); });

    // WARNING: be careful if changing this, bedrock depends on the class names "progress" and "total"
    $('document').ready(function () {
      $('body')
        .append($('<div />')
          .append($('<span />').text('Suite progress: '))
          .append(current)
          .append($('<span />').text('/'))
          .append(testcount)
          .append('&nbsp;&nbsp;&nbsp;')
          .append(stop)
        );
    });

    var initial = new Date();
    var resultJSON = {
      results: []
    };

    var stopOnFailure = false;

    var test = function (testcase, name) {
      var starttime = new Date();
      var el = $('<div />').addClass('test running');

      var output = $('<div />').addClass('output');
      var marker = $('<span />').text('[running]').addClass('result');
      var testfile = $('<span />').text(testcase).addClass('testfile');
      var nameSpan = $('<span />').text(name).addClass('name');
      var error = $('<span />').addClass('error-container');
      var time = $('<span />').addClass('time');
      output.append(marker, ' ', nameSpan, ' [', time, '] ', error, ' ', testfile);

      var scratch = $('<div />').addClass('scratch');

      el.append(output, scratch);
      $('body').append(el);

      testscratch = scratch.get(0);  // intentional, see top of file for var decl.

      var pass = function () {
        el.removeClass('running').addClass('passed').addClass('hidden');
        marker.text('[passed]').addClass('passed');
        var testTime = timer.elapsed(starttime);
        time.text(testTime);

        resultJSON.results.push({
          name: name,
          file: testcase,
          passed: true,
          time: testTime
        });

        current.text(resultJSON.results.length);

        notify(undefined);
      };

      var processQUnit = function (html) {
        // Required to make <del> and <ins> stay as tags.
        return html.replace(/&lt;del&gt;/g, '<del>').replace(/&lt;\/del&gt;/g, '</del>').replace(/&lt;ins&gt;/g, '<ins>').replace(/&lt;\/ins&gt;/g, '</ins>');
      };

      var failhtml = function (pre, e) {
        // Provide detailed HTML comparison information
        pre.html('Test failure: ' + e.message +
          '\nExpected: ' + htmlentities(e.diff.expected) +
          '\nActual: ' + htmlentities(e.diff.actual) +
          '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison)) + '\n\nStack: ' + e.stack);
      };

      var failnormal = function (pre, e) {
        pre.html(htmlentities(errors.clean(e)));
      };

      var populate = function (pre, e) {
        // If the diff property is available, this is an HTML diff error
        if (e.diff !== undefined) failhtml(pre, e);
        else failnormal(pre, e);
      };

      var fail = function (e) {
        el.addClass('failed').removeClass('running');
        marker.text('[failed]').addClass('failed');
        // Don't use .text() as it strips out newlines in IE, even when used
        // on a pre tag.
        var pre = $('<pre/>').addClass('error');
        populate(pre, e);
        error.append(pre);
        var testTime = timer.elapsed(starttime);
        time.text(testTime);



        resultJSON.results.push({
          name: name,
          file: testcase,
          passed: false,
          time: testTime,
          error: errors.clean(e)
        });
        current.text(resultJSON.results.length);

        if (stopOnFailure) {
          accumulator.cancel();
          current.text(testcount.text());
        }
        notify(errors.clean(e));
      };

      var htmlcompare = function (compares) {
        el.addClass('delayed').removeClass('running');
        marker.text('[delayed]').addClass('delayed');
        // Don't use .text() as it strips out newlines in IE, even when used
        // on a pre tag.
        error.append('<pre class="delayed">Test incomplete, bedrock will perform HTML comparison</pre>');
        var testTime = timer.elapsed(starttime);
        time.text(testTime);

        resultJSON.results.push({
          name: name,
          file: testcase,
          time: testTime,
          comparisonrequired: compares
        });
      };

      var notify = function (e) {
        var numFailed = $(resultJSON.results).filter(function (k, result) {
          return result.passed === false;
        }).length;

        var numPassed = resultJSON.results.length - numFailed;

        sendJson('tests/progress', {
          test: name,
          numFailed: numFailed,
          numPassed: numPassed,
          total: testcount.text(),
          error: e
        }, function () { }, function () { });
      };

      return {
        pass: pass,
        htmlcompare: htmlcompare,
        fail: fail
      };
    };

    var getCoverage = function () {
      return typeof __coverage__ === 'undefined' ? { } : __coverage__;
    };

    var done = function () {
      var setAsDone = function () {
        var totalTime = timer.elapsed(initial);
        resultJSON.time = totalTime;
        $('body').append('<div class="done">Test run completed in <span class="time">' + totalTime + '</span></div>');
        var resultBox = $('<textarea class="results" />').text(JSON.stringify(resultJSON));
        $('body').append(resultBox);
        $('.passed.hidden').removeClass('hidden');
      };

      sendJson('tests/done', { coverage: getCoverage() }, setAsDone, setAsDone);
    };

    var setStopOnFailure = function (flag) {
      stopOnFailure = flag;
    };

    var shouldStopOnFailure = function () {
      return stopOnFailure;
    };

    return {
      test: test,
      done: done,
      setStopOnFailure: setStopOnFailure,
      shouldStopOnFailure: shouldStopOnFailure
    };
  })();

  var htmlentities = function (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var builtins = ephox.bolt.module.config.builtins.browser;
  var load = ephox.bolt.loader.transporter.xhr.request;
  var loadscript = ephox.bolt.loader.api.scripttag.load;
  var browser = ephox.bolt.module.reader.browser;
  // var test = ephox.bolt.test.run.test;
  // var runtest = test.create(builtins, load, loadscript, reporter, reader);


  /*
   * Patch bolt to reuse the created module system for tests. This is primarily to decrease loading time when working remotely.
   */
  var install = ephox.bolt.module.bootstrap.install;
  var config = ephox.bolt.test.run.config;

  var runtest =  function (next, wrapper, testfile, name, replacements, deps, fn) {
    var enriched = config.enricher(reader, testfile, replacements);
    if (ephox.bolt.module.runtime.define === undefined) {
      install.install(enriched, builtins, load, loadscript);
    } else {
      enriched(function () { });
    }
    var wrapped = wrapper(reporter, testfile, name, fn, next);
    ephox.bolt.module.api.require(deps, wrapped);
  };

  var bomb = function (e) {
    $('body').append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
  };

  var runGlobalTests = function () {
    var loop = function (tests) {
      if (tests.length > 0) {
        var test = tests.shift();
        var report = reporter.test(test.filePath, test.name);

        try {
          test.test(function () {
            loop(tests);
          }, function (e) {
            report.fail(e);

            if (!reporter.shouldStopOnFailure()) {
              loop(tests);
            }
          });
        } catch (e) {
          report.fail(e);

          if (!reporter.shouldStopOnFailure()) {
            loop(tests);
          }
        }
      } else {
        reporter.done();
      }
    };
  
    loop(globalTests.slice());
  };

  api.loadtests = function (data) {
    testconfig = data.config;  // intentional, see top of file for var decl.
    var scripts = data.scripts;
    reporter.setStopOnFailure(data.stopOnFailure);
    var loop = function () {
      if (scripts.length > 0) {
        var testfile = 'project/' + scripts.shift();
        accumulator.register(testfile, wrapper.sync, wrapper.async);
        loadscript(testfile, loop, bomb);
      } else {
        testcount.text(accumulator.length() + globalTests.length); // intentional, see top of file for var decl.
        accumulator.drain(runtest, runGlobalTests);
      }
    };
    loop();
  };

  api.testrunner = function () {
    $.ajax({
      url: 'harness',
      dataType: 'json',
      success: api.loadtests,
      error: bomb
    });
  };

  api.getscratch = function () {
    return testscratch;
  };
})(Function('return this;')());

