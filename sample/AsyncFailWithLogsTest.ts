import * as UnitTest from '../src/client/ts/api/UnitTest';

declare let assert;

UnitTest.asynctest('AsyncFail with Logs Test', (success, failure) => {

  failure('This is a fake failure', {
    history: [
      {
        message: 'Log 1',
        trace: null,
        state: 0,
        entries: [ ]
      },
      {
        message: 'Log 2',
        trace: null,
        state: 0,
        entries: [
          {
            message: 'Log 2.1',
            trace: null,
            state: 0,
            entries: [ ]
          },
          {
            message: 'Log 2.2',
            trace: 'This is the trace',
            state: 0,
            entries: [ ]
          }
        ]
      }
    ]
  });
});