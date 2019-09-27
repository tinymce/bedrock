import { BrowserObject, Element } from 'webdriverio';
import * as EffectUtils from './EffectUtils';

interface KeyCombo {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey: boolean;
}

type KeyTextItem = { text: string };
type KeyComboItem = { combo: KeyCombo };
type KeyItem = KeyTextItem | KeyComboItem;

/*
 JSON API for data: {
   keys: [
     { text :: String } | { combo :: { ctrlKey :: Bool, key :: String } }
   ],
   selector :: String
 }
 */
export interface KeyData {
  keys: KeyItem[];
  selector: string;
}

const NO_ACTION = null;

// See https://w3c.github.io/webdriver/#keyboard-actions for key codes
const KEYS: Record<string, string> = {
  'null': '\u0000', // Reset keys
  'backspace': '\uE003',
  'tab': '\uE004',
  'clear': '\uE005',
  'return': '\uE006',
  'enter': '\uE007',
  'shift': '\uE008',
  'control': '\uE009',
  'alt': '\uE00A',
  'escape': '\uE00C',
  'pageup': '\uE00E',
  'pagedown': '\uE00F',
  'end': '\uE010',
  'home': '\uE011',
  'arrowleft': '\uE012',
  'arrowup': '\uE013',
  'arrowright': '\uE014',
  'arrowdown': '\uE015',
  'insert': '\uE016',
  'delete': '\uE017',

  // Tab and backspace (Firefox doesn't remap it)
  '\b': '\uE003',
  '\t': '\uE004',

  // Function keys
  'f1': '\uE031',
  'f2': '\uE032',
  'f3': '\uE033',
  'f4': '\uE034',
  'f5': '\uE035',
  'f6': '\uE036',
  'f7': '\uE037',
  'f8': '\uE038',
  'f9': '\uE039',
  'f10': '\uE03A',
  'f11': '\uE03B',
  'f12': '\uE03C',

  'meta': '\uE03D'
};

const mapKeys = (action: string[]): string[] => {
  return action.map((key) => {
    if (KEYS.hasOwnProperty(key.toLowerCase())) return KEYS[key.toLowerCase()];
    else return key;
  });
};

const scanCombo = (combo: KeyCombo) => {
  const keys: string[] = [];
  if (combo.ctrlKey) keys.push('Control');
  if (combo.metaKey) keys.push('Meta');
  if (combo.shiftKey) keys.push('Shift');
  if (combo.altKey) keys.push('Alt');
  keys.push(combo.key);
  return mapKeys(keys);
};

const isTextItem = (item: KeyItem): item is KeyTextItem => {
  return Object.prototype.hasOwnProperty.call(item, 'text');
};

const scanItem = (item: KeyItem) => {
  if (isTextItem(item)) return mapKeys([item.text]);
  else if (item.combo) return scanCombo(item.combo);
  return NO_ACTION;
};

const scan = (keys: KeyItem[]) => {
  return keys.reduce((acc: string[], key) => {
    const action = scanItem(key);
    if (action !== NO_ACTION) {
      return acc.concat(action);
    } else {
      return acc;
    }
  }, []);
};

const performAction = (driver: BrowserObject, target: Element, actions: string[], isW3C: boolean): Promise<void> => {
  // Note: The webdriverio types appear to be wrong for elementSendKeys, but their docs are correct
  // https://webdriver.io/docs/api/jsonwp.html#elementsendkeys
  if (isW3C) {
    return (driver as any).elementSendKeys(target.elementId, actions.join(''));
  } else {
    return (driver as any).elementSendKeys(target.elementId, actions);
  }
};

const execute = (driver: BrowserObject, data: KeyData) => {
  const actions = scan(data.keys);
  return EffectUtils.performActionOnTarget(driver, data, (target) => {
    return performAction(driver, target, actions, driver.isW3C);
  });
};

export const executor = (driver: BrowserObject) => {
  return (data: KeyData) => {
    return execute(driver, data);
  };
};
