import { BrowserObject, Element } from 'webdriverio';

export type ElementWithActions = Element & {
  performActions: (actions: Array<Record<string, any>>) => Promise<void>;
  releaseActions: () => Promise<void>;
};

const frameSelected = (driver: BrowserObject, frame: string): () => Promise<boolean> => {
  return () => {
    return driver.switchToFrame(frame).then(() => {
      return true;
    }).catch((e) => {
      if (!(e.name && e.name === 'no such frame')) {
        throw e;
      }
      return false;
    });
  }
};

const getTargetFromFrame = (driver: BrowserObject, selector: string) => {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  // Note: Don't use driver.$() here to lookup the frame as the object reference
  // returned doesn't work when passed to driver.switchToFrame() on Edge.
  return driver.findElement('css selector', frameSelector).then((frame) => {
    return driver.waitUntil(frameSelected(driver, frame), 100).then(() => {
      return driver.$(targetSelector).then((target) => {
        return target.waitForDisplayed(100).then(() => {
          return target as ElementWithActions;
        });
      });
    });
  });
};

const performActionOnFrame = <T>(driver: BrowserObject, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  return getTargetFromFrame(driver, selector).then((target) => {
    return action(target).then((result) => {
      return driver.switchToFrame(null).then(() => {
        return result;
      });
    });
  }).catch((err: any) => {
    return driver.switchToFrame(null).then(() => {
      return Promise.reject(err);
    });
  });
};

const getTargetFromMain = (driver: BrowserObject, selector: string) => {
  return driver.$(selector) as Promise<ElementWithActions>;
};

const performActionOnMain = <T>(driver: BrowserObject, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  return getTargetFromMain(driver, selector).then((target) => {
    return action(target);
  });
};

export const getTarget = (driver: BrowserObject, data: { selector: string }) => {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = <T>(driver: BrowserObject, data: { selector: string }, action: (target: ElementWithActions) => Promise<T>): Promise<T> => {
  const selector = data.selector;
  const performer = selector.indexOf('=>') > -1 ? performActionOnFrame : performActionOnMain;
  return performer(driver, selector, action);
};