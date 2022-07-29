import { Capabilities } from '@wdio/types';
import { Browser, Element } from 'webdriverio';
import * as EffectUtils from './EffectUtils';

interface KeyCombo {
  readonly key: string;
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey: boolean;
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

interface Action {
  type: 'text' | 'combo';
  data: string[];
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

const scanCombo = (combo: KeyCombo): string[] => {
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

const scanItem = (item: KeyItem): Action | null => {
  if (isTextItem(item)) {
    return { type: 'text', data: mapKeys([item.text]) };
  } else if (item.combo) {
    // If there are no modifiers and is only a key, then insert it as plain text
    const data = scanCombo(item.combo);
    return { type: data.length === 1 ? 'text' : 'combo', data };
  } else {
    return NO_ACTION;
  }
};

const scan = (keys: KeyItem[]): Action[] => {
  return keys.reduce<Action[]>((acc, key) => {
    const action = scanItem(key);
    if (action !== NO_ACTION) {
      return acc.concat([ action ]);
    } else {
      return acc;
    }
  }, []);
};

const scrollToAndFocus = async (driver: Browser<'async'>, target: Element<'async'>): Promise<void> => {
  await driver.execute((element) => {
    element.scrollIntoView();
    element.focus();
  }, target as unknown as HTMLElement);
};

const performAction = async (driver: Browser<'async'>, target: Element<'async'>, actions: Action[], isW3C: boolean): Promise<void> => {
  if (isW3C) {
    // TINY-8944: Since Safari has issues with using elementSendKeys we use a different method for combo keys.
    // So to simulate the same behaviour, ensure the target is scrolled in view and focused as per https://w3c.github.io/webdriver/#element-send-keys
    const isSafari = (driver.capabilities as Capabilities.DesiredCapabilities).browserName?.toLowerCase() === 'safari';
    const hasComboAction = actions.some((action) => action.type === 'combo');
    if (isSafari && hasComboAction) {
      await scrollToAndFocus(driver, target);
    }

    // Perform the actions
    for (const action of actions) {
      if (isSafari && action.type === 'combo') {
        await driver.keys(action.data);
      } else {
        await driver.elementSendKeys(target.elementId, action.data.join(''));
      }
    }
  } else {
    const keys = actions.flatMap((action) => action.data);
    // Note: The webdriverio types appear to be wrong for elementSendKeys, but their docs are correct
    // https://webdriver.io/docs/api/jsonwp.html#elementsendkeys
    return (driver as any).elementSendKeys(target.elementId, keys);
  }
};

const execute = (driver: Browser<'async'>, data: KeyData): Promise<void> => {
  const actions = scan(data.keys);
  return EffectUtils.performActionOnTarget(driver, data, (target) => {
    return performAction(driver, target, actions, driver.isW3C);
  });
};

export const executor = (driver: Browser<'async'>) => {
  return (data: KeyData): Promise<void> => {
    return execute(driver, data);
  };
};
