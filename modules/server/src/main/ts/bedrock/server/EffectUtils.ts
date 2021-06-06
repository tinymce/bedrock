import { Browser, Element } from 'webdriverio';

export type ElementWithActions = Element<'async'> & {
  performActions: (actions: Array<Record<string, any>>) => Promise<void>;
  releaseActions: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
const frameSelected = (driver: Browser<'async'>, frame: object): () => Promise<boolean> => {
  return () => {
    return driver.switchToFrame(frame).then(() => {
      return true;
    }).catch((e) => {
      if (!(e.name && e.name === 'no such frame')) {
        throw e;
      }
      return false;
    });
  };
};

const getTargetFromFrame = (driver: Browser<'async'>, selector: string) => {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  // Note: Don't use driver.$() here to lookup the frame as the object reference
  // returned doesn't work when passed to driver.switchToFrame() on Edge.
  return driver.findElement('css selector', frameSelector).then((frame) => {
    return driver.waitUntil(frameSelected(driver, frame), { timeout: 500 }).then(() => {
      return driver.$(targetSelector).then((target) => {
        return target.waitForDisplayed({ timeout: 500 }).then(() => {
          return target as ElementWithActions;
        });
      });
    });
  });
};

const performActionOnFrame = <T>(driver: Browser<'async'>, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
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

const getTargetFromMain = (driver: Browser<'async'>, selector: string) => {
  return driver.$(selector) as Promise<ElementWithActions>;
};

const performActionOnMain = <T>(driver: Browser<'async'>, selector: string, action: (target: ElementWithActions) => Promise<T>) => {
  return getTargetFromMain(driver, selector).then((target) => {
    return action(target);
  });
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