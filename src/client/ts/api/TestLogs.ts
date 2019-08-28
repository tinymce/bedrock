export enum TestLogEntryState { Original, Started, Finished }

export interface TestLogEntry {
  message: string;
  entries: TestLogEntry[ ];
  state: TestLogEntryState;
  trace: any;
}

export interface TestLogs {
  history: TestLogEntry[ ];
}

const emptyLogs = (): TestLogs => ({
  history: []
});

export const TestLogs = {
  emptyLogs
};
