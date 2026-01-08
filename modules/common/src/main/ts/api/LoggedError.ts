import { LoggedError, TestLabel } from './Main.js';
import { JsError, TestError } from './TestError.js';

export interface LoggedError extends JsError {
  logs: string[];
}

export const isLoggedError = (error: TestLabel | TestError | LoggedError): error is LoggedError =>
  typeof error === 'object' && Object.prototype.hasOwnProperty.call(error, 'logs');

export const loggedError = (error: TestError, logs: string[]): LoggedError => {
  const logged = error as LoggedError;
  logged.logs = logs;
  return logged;
};
