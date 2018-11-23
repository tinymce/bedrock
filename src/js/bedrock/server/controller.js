var mHud = require('../cli/hud');

const create = function(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel) {
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
    if (stickyFirstSession && stickyId === null && !timeoutError) {
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


module.exports = {
  create: create
};