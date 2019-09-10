import { BrowserObject, Element } from 'webdriverio';

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
  // Note: Don't use driver.$() here as it doesn't work on Edge
  return driver.findElement('css selector', frameSelector).then((frame) => {
    return driver.waitUntil(frameSelected(driver, frame), 100).then(() => {
      return driver.$(targetSelector).then((target) => {
        return target.waitForDisplayed(100).then(() => {
          return target;
        });
      });
    });
  });
};

const getTargetFromMain = (driver: BrowserObject, selector: string) => {
  return driver.$(selector);
};

export const getTarget = (driver: BrowserObject, data: { selector: string }) => {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = <T>(driver: BrowserObject, data: { selector: string }, action: (target: Element) => Promise<T>): Promise<T> => {
  return getTarget(driver, data).then((target) => {
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