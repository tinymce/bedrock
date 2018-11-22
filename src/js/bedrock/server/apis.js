var keys = require('./keyeffects');
var mouse = require('./mouseeffects');
var clipboard = require('./clipboardeffects');
var mHud = require('../cli/hud');
var routes = require('./routes');
var attempt = require('../core/attempt');
var waiter = require('../util/waiter');
var coverage = require('../core/coverage');

// This is how long to wait before checking if the driver is ready again
var pollRate = 2000;
// This is how many times to fail the driver check before the process fails
var maxInvalidAttempts = 300;

const makeController = function(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel) {
  const hud = mHud.create(testfiles, loglevel);
  const sessions = {};
  let stickyId = null;
  let timeoutError = false;
  let outputToHud = false;

  // clean up any sessions which have not had any activity in the last 10 seconds
  setInterval(function() {
    const now = Date.now();
    const ids = Object.keys(sessions);
    ids.forEach((id) => {
      // never delete a sticky session
      if (id === stickyId) return;
      const session = sessions[id];
      if (now - session.alive > 10000) {
        // session is dead
        delete sessions[id];
      }
    });
  }, 10000);

  const getSession = function(sessionId) {
    if (stickyFirstSession && stickyId === null) {
      stickyId = sessionId;
    }
    const now = Date.now();
    let session = sessions[sessionId];
    if (session === undefined) {
      session = {
        id: sessionId,
        alive: now,
        updated: now,
        results: [],
        lookup: {},
        inflight: null,
        previous: null,
        done: false,
      };
      sessions[sessionId] = session;
    }
    session.alive = now;
    return session;
  };

  const enableHud = function() {
    outputToHud = true;
  };

  const updateHud = function(session) {
    if (!outputToHud) return;
    if (stickyFirstSession && (timeoutError  || session.id !== stickyId)) return;
    const id = session.id;
    const numFailed = session.results.reduce((sum, res) => sum + (res.passed ? 0 : 1), 0);
    const numPassed = session.results.length - numFailed;
    const test = session.inflight !== null ? session.inflight.name : (session.previous !== null ? session.previous.name : '');
    const done = session.done;
    hud.update({ id, test, numPassed, numFailed, done });
  };

  const recordAlive = function(sessionId) {
    getSession(sessionId);
  };

  const recordTestStart = function(id, name, file) {
    const session = getSession(id);
    const start = Date.now();
    session.inflight = { name, file, start };
    session.updated = Date.now();
    session.done = false;
    updateHud(session);
  };

  const recordTestResult = function(id, name, file, passed, time, error) {
    const session = getSession(id);
    const record = { name, file, passed, time, error };
    if (session.lookup[file] !== undefined && session.lookup[file][name] !== undefined) {
      // rerunning a test
      session.results[session.lookup[file][name]] = record;
    } else {
      // adding a new test record
      session.lookup[file] = session.lookup[file] || {};
      session.lookup[file][name] = session.results.length;
      session.results.push(record);
    }
    // this check is just in case the test start arrives before the result of the previous
    if (session.inflight !== null && session.inflight.file === file && session.inflight.name === name) {
      session.previous = session.inflight;
      session.inflight = null;
    }
    session.updated = Date.now();
    session.done = false;
    updateHud(session);
  };

  const recordDone = function(id) {
    const session = getSession(id);
    session.done = true;
    session.updated = Date.now();
    updateHud(session);
  };

  const formatTime = function (time) {
    return (time / 1000) + 's';
  };

  const currentTest = function(session) {
    if (session.inflight !== null) {
      return session.inflight.name + ' [' + session.inflight.file + ']';
    } else {
      return 'UNKNOWN???'
    }
  };

  const awaitDone = function() {
    const start = Date.now();
    if (!stickyFirstSession) {
      const message = 'Must specify sticky session mode to wait for it';
      const now = start;
      const results = [];
      return Promise.reject({message, results, start, now});
    }
    return new Promise(function(resolve, reject) {
      const poller = setInterval(() => {
        const now = Date.now();
        const allElapsed = now - start;
        if (stickyId !== null) {
          const session = sessions[stickyId];
          const results = session.results;
          if (session.done) {
            resolve({ results, start, now });
            clearInterval(poller);
          } else {
            if (session.inflight !== null && (now - session.inflight.start) > singleTimeout) {
              // one test took too long
              const elapsed = formatTime(now - session.inflight.start);
              const message = 'Test: ' + currentTest(session) + ' ran too long (' + elapsed + '). Limit for an individual test is set to: ' + formatTime(singleTimeout);
              reject({ message, results, start, now });
              clearInterval(poller);
              timeoutError = true;
            } else if (allElapsed > overallTimeout) {
              // combined tests took too long
              const message = 'Tests timed out: ' + formatTime(allElapsed) + '. Limit is set to ' + formatTime(overallTimeout) + '. Current test: ' + currentTest(session);
              reject({ message, results, start, now });
              clearInterval(poller);
              timeoutError = true;
            }
          }
        } else if (allElapsed > overallTimeout) {
          // combined tests took too long
          const message = 'Tests took too long to start';
          const results = [];
          reject({ message, results, start, now });
          clearInterval(poller);
          timeoutError = true;
        }
      }, 1000);
    });
  };

  return {
    enableHud,
    recordAlive,
    recordTestStart,
    recordTestResult,
    recordDone,
    awaitDone
  };
};

// TODO: Do not use files here.
var create = function (master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel) {

  // On IE, the webdriver seems to load the page before it's ready to start
  // responding to commands. If the testing page itself tries to interact with
  // effects before driver.get has returned properly, it throws "UnsupportedOperationErrors"
  // This code is designed to allow the driver.get promise launched in bedrock-auto to
  // let the server known when it is able to use driver when responding to effect ajax calls.
  var waitForDriverReady = function (attempts, f) {
    if (pageHasLoaded && master !== null) return master.waitForIdle(f, 'effect');
    else if (attempts === 0) return Promise.reject('Driver never appeared to be ready');
    else return waiter.delay({}, pollRate).then(function () {
      return waitForDriverReady(attempts - 1, f);
    });
  };

  var driverRouter = function (url, apiLabel, executor) {
    var effect = function (driver) {
      return function (data) {
        return waitForDriverReady(maxInvalidAttempts, function () {
          return executor(driver)(data);
        });
      };
    };

    return attempt.cata(maybeDriver, function () {
      return routes.unsupported(
        'POST',
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, function (driver) {
      return routes.effect('POST', url, effect(driver));
    });
  };


  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

  const controller = makeController(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel);

  var routers = [

    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    routes.effect('POST', '/tests/alive', function (data) {
      controller.recordAlive(data.session);
      return Promise.resolve({});
    }),
    routes.effect('POST', '/tests/start', function (data) {
      controller.recordTestStart(data.session, data.name, data.file);
      return Promise.resolve({});
    }),
    routes.effect('POST', '/tests/result', function (data) {
      controller.recordTestResult(data.session, data.name, data.file, data.passed, data.time, data.error);
      return Promise.resolve({});
    }),
    routes.effect('POST', '/tests/done', function (data) {
      coverage.writeCoverageData(data.coverage);
      controller.recordDone(data.session);
      return Promise.resolve({});
    }),
    // This does not need the webdriver.
    routes.effect('POST', '/clipboard', clipboard.route(basedir, projectdir))
  ];

  return {
    routers: routers,
    markLoaded: markLoaded,
    enableHud: controller.enableHud,
    awaitDone: controller.awaitDone
  };
};

module.exports = {
  create: create
};