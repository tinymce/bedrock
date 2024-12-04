import { ErrorData } from '@ephox/bedrock-common';
import * as Hud from '../cli/Hud';
import * as Type from '../util/Type';

export interface TestErrorData {
  readonly data: ErrorData;
  readonly text: string;
}

export interface TestResult {
  readonly name: string;
  readonly file: string;
  readonly passed: boolean;
  readonly time: string;
  readonly skipped: string;
  readonly error: TestErrorData | null;
}

export interface TestResults {
  readonly message?: string;
  readonly results: TestResult[];
  readonly start: number;
  readonly now: number;
}

interface PreviousTest {
  readonly name: string;
  readonly file: string;
  readonly end: number;
}

interface TestSession {
  readonly id: string;
  readonly results: TestResult[];
  readonly lookup: Record<string, Record<string, number>>;
  alive: number;
  updated: number;
  previous: PreviousTest | null;
  done: boolean;
  error?: string;
  totalTests: number;
  currentTest: number;
}

export interface Controller {
  readonly enableHud: () => void;
  readonly recordAlive: (sessionId: string) => void;
  readonly recordTestStart: (id: string, name: string, file: string, currentCount: number, totalTests: number) => void;
  readonly recordTestResults: (id: string, results: TestResult[]) => void;
  readonly recordDone: (id: string, error?: string) => void;
  readonly awaitDone: () => Promise<TestResults>;
}

export const create = (stickyFirstSession: boolean, overallTimeout: number, testfiles: string[], loglevel: 'simple' | 'advanced'): Controller => {
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
        previous: null,
        done: false,
        totalTests: testfiles.length,
        currentTest: 0
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
    const numFailed = session.results.reduce((sum, res) => sum + (res.passed || res.skipped ? 0 : 1), 0);
    const numSkipped = session.results.reduce((sum, res) => sum + (res.skipped ? 1 : 0), 0);

    /*
     * Due to TINY-11177 we no longer receive a result for every passing test.
     * In order for the HUD numbers to make sense, the "current test" number is now sent with status reports.
     *
     * We use this to calculate the number of passing tests, assuming every non-reported result is a pass.
     */
    const numPassed = session.currentTest - numFailed - numSkipped;
    const test = session.previous !== null ? session.previous.name : '';
    const done = session.done;
    hud.update({id, test, numPassed, numSkipped, numFailed, done, totalTests: session.totalTests});
  };

  const recordAlive = (sessionId: string) => {
    getSession(sessionId);
  };

  const recordTestStart = (id: string, name: string, file: string, currentCount: number, totalTests: number) => {
    const session = getSession(id);
    session.updated = Date.now();
    session.totalTests = totalTests;
    session.currentTest = currentCount;
    session.done = false;
    updateHud(session);
  };

  const recordTestResult = (id: string, name: string, file: string, passed: boolean, time: string, error: TestErrorData | null, skipped: string) => {
    const now = Date.now();
    const session = getSession(id);
    const record = { name, file, passed, time, error, skipped };
    if (session.lookup[file] !== undefined && session.lookup[file][name] !== undefined) {
      // rerunning a test
      session.results[session.lookup[file][name]] = record;
    } else {
      // adding a new test record
      session.lookup[file] = session.lookup[file] || {};
      session.lookup[file][name] = session.results.length;
      session.results.push(record);
    }
    session.updated = now;
    session.done = false;
    updateHud(session);
  };

  const recordTestResults = (id: string, results: TestResult[]) => {
    const now = Date.now();
    const session = getSession(id);
    if (results.length > 0) {
      const {name, file} = results.slice(-1)[0];
      session.previous = {
        name,
        file,
        end: now
      };
    }
    results.forEach(
      ({name, file, passed, time, error, skipped}) =>
        recordTestResult(id, name, file, passed, time, error, skipped)
    );
  };

  const recordDone = (id: string, error?: string) => {
    const session = getSession(id);
    session.done = true;
    session.error = error;
    if (!error) {
      session.currentTest = session.totalTests;
    }
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
            if (Type.isString(session.error)) {
              const message = `Unexpected runner error: ${session.error}`;
              reject({ message, results, start, now });
            } else {
              resolve({ results, start, now });
            }
            clearInterval(poller);
          } else {
            if (allElapsed > overallTimeout) {
              // combined tests took too long
              let lastTest;
              if (session.previous !== null) {
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
    recordTestResults,
    recordDone,
    awaitDone
  };
};
