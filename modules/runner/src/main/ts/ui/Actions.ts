import { makeUrl } from '../core/Utils';

export interface Actions {
  readonly restartTests: () => void;
  readonly retryTest: (offset: number, failed: number, skipped: number, retry?: number) => void;
  readonly nextTest: (offset: number, failed: number, skipped: number) => void;
  readonly reloadPage: (offset: number, failed: number, skipped: number, retry?: number) => void;
  readonly updateHistory: (offset: number, failed: number, skipped: number, retry?: number) => void;
}

export const Actions = (session: string): Actions => {
  const reloadPage = (offset: number, failed: number, skipped: number, retry = 0) => {
    const url = makeUrl(session, offset, failed, skipped, retry);
    window.location.assign(url);
  };

  const updateHistory = (offset: number, failed: number, skipped: number, retry = 0) => {
    const url = makeUrl(session, offset, failed, skipped, retry);
    window.history.pushState({}, '', url);
  };

  return {
    restartTests: () => reloadPage(0, 0, 0),
    retryTest: (offset, failed, skipped, retry) => reloadPage(offset, failed - 1, skipped, retry),
    nextTest: (offset, failed, skipped) => reloadPage(offset + 1, failed, skipped),
    reloadPage,
    updateHistory
  };
};