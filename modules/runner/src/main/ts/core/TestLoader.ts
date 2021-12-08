import Promise from '@ephox/wrap-promise-polyfill';
import { ErrorCatcher } from '../errors/ErrorCatcher';

export const load = (scriptUrl: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;

    // Setup the error catcher to handle syntax errors or similar in the scripts
    const errorCatcher = ErrorCatcher();

    const cleanup = () => {
      script.removeEventListener('load', success);
      script.removeEventListener('error', failure);
      errorCatcher.destroy();
      document.body.removeChild(script);
    };

    const success = () => {
      cleanup();
      resolve();
    };

    const failure = (e: Error | ErrorEvent) => {
      cleanup();
      if (e instanceof Event) {
        reject(new Error(`Failed to load script: ${scriptUrl}`));
      } else {
        reject(e);
      }
    };

    // Bind the events
    errorCatcher.bind(failure);
    script.addEventListener('load', success);
    script.addEventListener('error', failure);

    // Add the script to the dom to load it
    document.body.appendChild(script);
  });