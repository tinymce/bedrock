import * as Hud from '../cli/Hud';

export interface TestResult {
  name: string;
  file: string;
  passed: boolean;
  time: string;
  skipped?: boolean;
  error: string;
}

export interface TestResults {
  message?: string;
  results: TestResult[];
  start: number;
  now: number;
}

interface InflightTest {
  name: string;
  file: string;
  start: number;
}

interface PreviousTest extends InflightTest {
  end: number;
}

interface TestSession {
  id: string;
  alive: number;
  updated: number;
  results: TestResult[];
  lookup: Record<string, Record<string, number>>;
  inflight: InflightTest | null;
  previous: PreviousTest | null;
  done: boolean;
  totalTests: number;
}

// allow a little extra time for a test timeout so the runner can handle it gracefully
const timeoutGrace = 2000;
export const create = (stickyFirstSession: boolean, singleTimeout: number, overallTimeout: number, testfiles: string[], loglevel: 'simple' | 'advanced') => {
  const hud = Hud.create(testfiles, loglevel);
  const sessions: Record<string, TestSession> = {};
  let stickyId: string | null = null;
  let timeoutError = false;
  let outputToHud = false;

  // clean up any sessions which have not had any activity in the last 10 seconds
  setInterval(() => {
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

  const getSession = (sessionId: string): TestSession => {
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
        totalTests: testfiles.length
      };
      sessions[sessionId] = session;
    }
    session.alive = now;
    return session;
  };

  const enableHud = () => {
    outputToHud = true;
  };

  const updateHud = (session: TestSession) => {
    if (!outputToHud) return;
    if (stickyFirstSession && (timeoutError || session.id !== stickyId)) return;
    const id = session.id;
    const numFailed = session.results.reduce((sum, res) => sum + (res.passed ? 0 : 1), 0);
    const numPassed = session.results.length - numFailed;
    const test = session.inflight !== null ? session.inflight.name : (session.previous !== null ? session.previous.name : '');
    const done = session.done;
    hud.update({id, test, numPassed, numFailed, done, totalTests: session.totalTests});
  };

  const recordAlive = (sessionId: string) => {
    getSession(sessionId);
  };

  const recordTestStart = (id: string, name: string, file: string, totalTests: number) => {
    const session = getSession(id);
    const start = Date.now();
    session.inflight = {name, file, start};
    session.updated = Date.now();
    session.totalTests = totalTests;
    session.done = false;
    updateHud(session);
  };

  const recordTestResult = (id: string, name: string, file: string, passed: boolean, time: string, error: string) => {
    const now = Date.now();
    const session = getSession(id);
    const record = {name, file, passed, time, error};
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
      session.previous = {
        ...session.inflight,
        end: now
      };
      session.inflight = null;
    }
    session.updated = now;
    session.done = false;
    updateHud(session);
  };

  const recordDone = (id: string) => {
    const session = getSession(id);
    session.done = true;
    session.updated = Date.now();
    updateHud(session);
  };

  const formatTime = (time: number) => {
    return (time / 1000) + 's';
  };

  const testName = (test: { name: string; file: string }) => {
    if (test !== null) {
      return test.name + ' [' + test.file + ']';
    } else {
      return 'UNKNOWN???';
    }
  };

  const awaitDone = (): Promise<TestResults> => {
    const start = Date.now();
    if (!stickyFirstSession) {
      const message = 'Must specify sticky session mode to wait for it';
      const now = start;
      const results: TestResult[] = [];
      return Promise.reject({message, results, start, now});
    }
    return new Promise((resolve, reject) => {
      const poller = setInterval(() => {
        const now = Date.now();
        const allElapsed = now - start;
        if (stickyId !== null) {
          const session = sessions[stickyId];
          const results = session.results;
          if (session.done) {
            resolve({results, start, now});
            clearInterval(poller);
          } else {
            if (session.inflight !== null && (now - session.inflight.start) > (singleTimeout + timeoutGrace)) {
              // one test took too long
              const elapsed = formatTime(now - session.inflight.start);
              const message = 'Test: ' + testName(session.inflight) + ' ran too long (' + elapsed + '). Limit for an individual test is set to: ' + formatTime(singleTimeout);
              reject({message, results, start, now});
              clearInterval(poller);
              timeoutError = true;
            } else if (allElapsed > overallTimeout) {
              // combined tests took too long
              let lastTest;
              if (session.inflight !== null) {
                const runningTime = now - session.inflight.start;
                lastTest = 'Current test: ' + testName(session.inflight) + ' running ' + formatTime(runningTime) + '.';
              } else if (session.previous !== null) {
                const sincePrevious = now - session.previous.end;
                lastTest = 'Previous test: ' + testName(session.previous) + ' finished ' + formatTime(sincePrevious) + ' ago.';
              } else {
                lastTest = 'No tests have been run.';
              }
              // find the top 10 longest running tests
              const time2num = (time: string) => parseFloat(time.charAt(time.length - 1) === 's' ? time.substr(0, time.length - 2) : time);
              const top10 = session.results.slice(0).sort((a, b) => time2num(b.time) - time2num(a.time)).slice(0, 10);
              const longest = top10.map((result, i) => '' + (i + 1) + '. ' + testName(result) + ' in ' + result.time).join('\n');
              const estimatedTotal = Math.ceil(((allElapsed / session.results.length) * testfiles.length) / 1000) * 1000;
              const message = 'Tests timed out: ' + formatTime(allElapsed) + '. Limit is set to ' + formatTime(overallTimeout) +
                  '. Estimated required time ' + formatTime(estimatedTotal) + '.\n' + lastTest + '\nTop 10 longest running tests:\n' + longest;
              reject({message, results, start, now});
              clearInterval(poller);
              timeoutError = true;
            }
          }
        } else if (allElapsed > overallTimeout) {
          // combined tests took too long
          const message = 'Tests took too long to start';
          const results: TestResult[] = [];
          reject({message, results, start, now});
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
