import { BrowserObject } from 'webdriverio';
import * as EffectUtils from './EffectUtils';

/*
 JSON API for data: {
   type :: String, ("move" || "click" || "down" || "up")
   selector :: String
 }
 */
export interface MouseData {
  type: 'move' | 'click' | 'down' | 'up';
  selector: string;
}

const performAction = (target: EffectUtils.ElementWithActions, type: string) => {
  const action = {
    type: 'pointer',
    id: 'pointer1',
    parameters: { pointerType: 'mouse' },
    actions: [
      { type: type, button: 0 },
      { type: 'pause', duration: 10 },
      { type: type, button: 0 }
    ]
  };
  return target.performActions([action]).then(() => {
    return target.releaseActions();
  });
};

const doAction = (target: EffectUtils.ElementWithActions, type: MouseData['type']): Promise<void> => {
  if (type === 'move') {
    return target.moveTo();
  } else if (type === 'down' || type === 'up') {
    return target.moveTo().then(() => {
      return performAction(target, type === 'down' ? 'pointerDown' : 'pointerUp');
    });
  // MicrosoftEdge does support this, but does not seem to support click in an ActionSequence
  } else if (type === 'click') {
    return target.click();
  } else {
    return Promise.reject('Unknown mouse effect type: ' + type);
  }
};

const execute = (driver: BrowserObject, data: MouseData) => {
  return EffectUtils.performActionOnTarget(driver, data, (target) => {
    return doAction(target, data.type);
  });
};

export const executor = (driver: BrowserObject) => {
  return (data: MouseData) => {
    return execute(driver, data);
  };
};
