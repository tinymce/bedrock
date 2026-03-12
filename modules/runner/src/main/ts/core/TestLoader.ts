import { ErrorCatcher } from '../errors/ErrorCatcher';

const RETRY = 5;
const BASE_DELAY = 1000;
const DELAY_FACTOR = 2;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: Error): boolean => {
  const message = error.message.toLowerCase();

  // Likely network/load issues
  if (message.includes('failed to load script')) return true;
  if (message.includes('timeout loading script')) return true;

  // Likely code issues inside the script, so retrying same URL is pointless
  if (message.includes('unhandled promise rejection')) return false;
  if (message.includes('syntax')) return false;
  if (message.includes('unexpected token')) return false;
  return false;
};

const loadOnce = (scriptUrl: string, attempt: number): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;

    const errorCatcher = ErrorCatcher();
    const binding = errorCatcher.bind(reject);

    const cleanup = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      binding.unbind();
      errorCatcher.destroy();

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const onLoad = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to load script: ${scriptUrl} on ${attempt}`));
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    document.body.appendChild(script);
  });

const loadScript = async (url: string, attempt: number): Promise<void> => {
  try {
    await loadOnce(url, attempt);
  } catch (err) {
    if (attempt >= RETRY || !shouldRetry(err)) {
      throw err;
    }
    const waitMs = BASE_DELAY * Math.pow(DELAY_FACTOR, attempt);
    await delay(waitMs);

    return loadScript(url, attempt + 1);
  }
};

export const load = async (scriptUrl: string): Promise<void> => loadScript(scriptUrl, 0);