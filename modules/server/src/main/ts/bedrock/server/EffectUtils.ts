// import type { ChainablePromiseElement } from "webdriverio";
// Heavily considering getting rid of this silly "ElementWithActions" and marking things
// as "ChainablePromiseElement" so that we can assume they are all lazy element and let wdio
// handle the timings. In the meantime, converting things to Element to maintain status quo
export type ElementWithActions = WebdriverIO.Element & {
  readonly performActions: (actions: Array<Record<string, any>>) => Promise<void>;
  readonly releaseActions: () => Promise<void>;
};

type ElementReference = ReturnType<WebdriverIO.Browser['findElement']>;

const frameSelected = (driver: WebdriverIO.Browser, frame: ElementReference) => async (): Promise<boolean> => {
  try {
    const frameRef = await frame;
    const frameEl = await driver.$(frameRef);
    await driver.switchFrame(frameEl);
    // await driver.switchToFrame(await frame); -- deprecated
    // await driver.switchFrame(await frame);
    // In order to get rid of swithToFrame we need to figure out if the chainable element
    // would work on Edge first then we can swithFrame(driver.$(frameSelector))
    return true;
  } catch (e) {
    if (!(e.name && e.name === 'no such frame')) {
      throw e;
    }
    return false;
  }
};

const getTargetFromFrame = async (driver: WebdriverIO.Browser, selector: string): Promise<ElementWithActions> => {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  // Note: Don't use driver.$() here to lookup the frame as the object reference
  // returned doesn't work when passed to driver.switchToFrame() on Edge.
  const frame = driver.findElement('css selector', frameSelector);
  await driver.waitUntil(frameSelected(driver, frame), { timeout: 500 });
  const target = await driver.$(targetSelector);
  await target.waitForDisplayed({ timeout: 500 });
  return (await target.getElement());
};

const performActionOnFrame = async <T>(driver: WebdriverIO.Browser, selector: string, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  try {
    const target = await getTargetFromFrame(driver, selector);
    const result = await action(target);
    // await driver.switchToFrame(null);
    await driver.switchFrame(null);
    return result;
  } catch (err: any) {
    return driver.status().then(status => {
      console.error('webdriver failed with status', status);
      return Promise.reject(err);
    });
  }
};

const getTargetFromMain = async (driver: WebdriverIO.Browser, selector: string): Promise<ElementWithActions> => {
  return await driver.$(selector).getElement();
};

const performActionOnMain = async <T>(driver: WebdriverIO.Browser, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  const target = await getTargetFromMain(driver, selector);
  return action(target);
};

export const getTarget = (driver: WebdriverIO.Browser, data: { selector: string }): Promise<ElementWithActions> => {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = <T>(driver: WebdriverIO.Browser, data: { selector: string }, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  const selector = data.selector;
  const performer = selector.indexOf('=>') > -1 ? performActionOnFrame : performActionOnMain;
  return performer(driver, selector, action);
};
