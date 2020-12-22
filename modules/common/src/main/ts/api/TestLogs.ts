export enum TestLogEntryState { Original, Started, Finished }

export interface TestLogEntry {
  message: string;
  entries: TestLogEntry[];
  state: TestLogEntryState;
  trace: any;
}

export interface TestLogs {
  history: TestLogEntry[];
}

export const init = (): TestLogs => ({
  history: []
});

export const createLogEntry = (message: string): TestLogEntry => ({
  message,
  trace: null,
  state: TestLogEntryState.Original,
  entries: []
});
