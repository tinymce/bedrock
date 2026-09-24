import { Browser, Element } from 'webdriverio';

export type ElementWithActions = Element & {
  readonly performActions: (actions: Array<Record<string, any>>) => Promise<void>;
  readonly releaseActions: () => Promise<void>;
};

const frameSelected = (driver: Browser, frameSelector: string) => async (): Promise<boolean> => {
  try {
    // Note: Use switchFrame() rather than the raw switchToFrame() protocol command. From
    // WebdriverIO v9 the session tracks the active browsing context for WebDriver Bidi
    // separately, and only switchFrame() keeps that in sync with the classic frame. Calling
    // switchToFrame() directly leaves Bidi commands (including $ and execute) pointed at the
    // top level document, so effects get sent outside the iframe.
    await driver.switchFrame(await driver.$(frameSelector));
    return true;
  } catch (e) {
    if (!(e.name && e.name === 'no such frame')) {
      throw e;
    }
    return false;
  }
};

const getTargetFromFrame = async (driver: Browser, selector: string): Promise<ElementWithActions> => {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  await driver.waitUntil(frameSelected(driver, frameSelector), { timeout: 500 });
  const target = await driver.$(targetSelector);
  await target.waitForDisplayed({ timeout: 500 });
  return target as unknown as ElementWithActions;
};

const performActionOnFrame = async <T>(driver: Browser, selector: string, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  try {
    const target = await getTargetFromFrame(driver, selector);
    const result = await action(target);
    await driver.switchFrame(null);
    return result;
  } catch (err: any) {
    return driver.status().then(status => {
      console.error('webdriver failed with status', status);
      return Promise.reject(err);
    });
  }
};

const getTargetFromMain = async (driver: Browser, selector: string): Promise<ElementWithActions> => {
  const target = await driver.$(selector);
  return target as unknown as ElementWithActions;
};

const performActionOnMain = async <T>(driver: Browser, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  const target = await getTargetFromMain(driver, selector);
  return action(target);
};

export const getTarget = (driver: Browser, data: { selector: string }): Promise<ElementWithActions> => {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = <T>(driver: Browser, data: { selector: string }, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  const selector = data.selector;
  const performer = selector.indexOf('=>') > -1 ? performActionOnFrame : performActionOnMain;
  return performer(driver, selector, action);
};
