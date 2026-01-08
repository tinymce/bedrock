import { ExecuteFn, Hook } from '@ephox/bedrock-common';
import * as Runnable from './Runnable.js';

export const createHook = (title: string, fn: ExecuteFn | undefined): Hook => {
  return Runnable.createRunnable(title, fn);
};