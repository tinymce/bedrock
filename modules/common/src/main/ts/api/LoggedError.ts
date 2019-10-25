import { TestError } from './TestError';

export interface LoggedError {
  error: TestError;
  logs: string[];
}
