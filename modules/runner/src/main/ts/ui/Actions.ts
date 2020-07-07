import { makeUrl } from '../core/Utils';

export interface Actions {
  readonly restartTests: () => void;
  readonly retryTest: (offset: number, failed: number, retry?: number) => void;
  readonly skipTest: (offset: number, failed: number) => void;
  readonly reloadPage: (offset: number, failed: number, retry?: number) => void;
  readonly updateHistory: (offset: number, failed: number, retry?: number) => void;
}

export const Actions = (session: string): Actions => {
  const reloadPage = (offset: number, failed: number, retry = 0) => {
    const url = makeUrl(session, offset, failed, retry);
    window.location.assign(url);
  };

  const updateHistory = (offset: number, failed: number, retry = 0) => {
    const url = makeUrl(session, offset, failed, retry);
    window.history.pushState({}, '', url);
  };

  return {
    restartTests: () => reloadPage(0, 0),
    retryTest: (offset, failed, retry) => reloadPage(offset, failed - 1, retry),
    skipTest: (offset, failed) => reloadPage(offset + 1, failed),
    reloadPage,
    updateHistory
  };
};