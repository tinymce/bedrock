import { Browser } from 'webdriverio';
import * as EffectUtils from './EffectUtils';

/*
 JSON API for data: {
   type :: String, ("move" || "click" || "down" || "up")
   selector :: String
 }
 */
export interface MouseData {
  readonly type: 'move' | 'click' | 'down' | 'up';
  readonly selector: string;
}

const performAction = async (target: EffectUtils.ElementWithActions, type: string) => {
  const action = {
    type: 'pointer',
    id: 'pointer1',
    parameters: { pointerType: 'mouse' },
    actions: [
      { type, button: 0 },
      { type: 'pause', duration: 10 },
      { type, button: 0 }
    ]
  };
  await target.performActions([action]);
  return target.releaseActions();
};

const doAction = async (target: EffectUtils.ElementWithActions, type: MouseData['type']): Promise<void> => {
  if (type === 'move') {
    return target.moveTo();
  } else if (type === 'down' || type === 'up') {
    await target.moveTo();
    return performAction(target, type === 'down' ? 'pointerDown' : 'pointerUp');
  // MicrosoftEdge does support this, but does not seem to support click in an ActionSequence
  } else if (type === 'click') {
    return target.click();
  } else {
    return Promise.reject('Unknown mouse effect type: ' + type);
  }
};

const execute = (driver: Browser<'async'>, data: MouseData): Promise<void> => {
  return EffectUtils.performActionOnTarget(driver, data, (target) => {
    return doAction(target, data.type);
  });
};

export const executor = (driver: Browser<'async'>) => {
  return (data: MouseData): Promise<void> => {
    return execute(driver, data);
  };
};
