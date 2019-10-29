import { TestError } from './TestError';

export interface LoggedError {
  error: TestError;
  logs: string[];
}

export const loggedError = (error: TestError, logs: string[]): LoggedError =>
  ({error, logs});
