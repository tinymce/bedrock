import { makeUrl } from '../core/Utils';

export interface Actions {
  restartTests: () => void;
  retryTest: (offset: number, failed: number, retry?: number) => void;
  skipTest: (offset: number, failed: number) => void;
  reloadPage: (offset: number, failed: number, retry?: number) => void;
  updateHistory: (offset: number, failed: number, retry?: number) => void;
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
    retryTest: reloadPage,
    skipTest: (offset, failed) => reloadPage(offset + 1, failed),
    reloadPage,
    updateHistory
  };
};