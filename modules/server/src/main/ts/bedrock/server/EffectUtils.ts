import { Browser, Element } from 'webdriverio';

export type ElementWithActions = Element<'async'> & {
  readonly performActions: (actions: Array<Record<string, any>>) => Promise<void>;
  readonly releaseActions: () => Promise<void>;
};

type ElementReference = ReturnType<Browser<'sync'>['findElement']>;

const frameSelected = (driver: Browser<'async'>, frame: ElementReference) => async (): Promise<boolean> => {
  try {
    await driver.switchToFrame(frame);
    return true;
  } catch (e) {
    if (!(e.name && e.name === 'no such frame')) {
      throw e;
    }
    return false;
  }
};

const getTargetFromFrame = async (driver: Browser<'async'>, selector: string): Promise<ElementWithActions> => {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  // Note: Don't use driver.$() here to lookup the frame as the object reference
  // returned doesn't work when passed to driver.switchToFrame() on Edge.
  const frame = await driver.findElement('css selector', frameSelector);
  await driver.waitUntil(frameSelected(driver, frame), { timeout: 500 });
  const target = await driver.$(targetSelector);
  await target.waitForDisplayed({ timeout: 500 });
  return target as ElementWithActions;
};

const performActionOnFrame = async <T>(driver: Browser<'async'>, selector: string, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  try {
    const target = await getTargetFromFrame(driver, selector);
    const result = await action(target);
    await driver.switchToFrame(null);
    return result;
  } catch (err: any) {
    await driver.switchToFrame(null);
    return Promise.reject(err);
  }
};

const getTargetFromMain = async (driver: Browser<'async'>, selector: string): Promise<ElementWithActions> => {
  return driver.$(selector);
};

const performActionOnMain = async <T>(driver: Browser<'async'>, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  const target = await getTargetFromMain(driver, selector);
  return action(target);
};

export const getTarget = (driver: Browser<'async'>, data: { selector: string }): Promise<ElementWithActions> => {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = <T>(driver: Browser<'async'>, data: { selector: string }, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  const selector = data.selector;
  const performer = selector.indexOf('=>') > -1 ? performActionOnFrame : performActionOnMain;
  return performer(driver, selector, action);
};