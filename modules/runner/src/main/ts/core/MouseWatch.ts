export interface MouseWatch {
  readonly hasMoved: () => boolean;
  readonly clear: () => void;
}

type Open = XMLHttpRequest['open'];

const isMouseEffect = (url: string): boolean => url.replace(/[?#].*$/, '').endsWith('/mouse');

/*
 * Mouse effects are ajax calls the test code makes directly to the server, so the runner is
 * never told when the driver has moved the real mouse pointer. Watching XMLHttpRequest is the
 * only way to know that the pointer needs to be put back before the next test runs.
 */
export const MouseWatch = (): MouseWatch => {
  let moved = false;
  const open: Open = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]): void {
    if (isMouseEffect(String(url))) {
      moved = true;
    }
    (open as (...args: unknown[]) => void).apply(this, [ method, url, ...rest ]);
  };

  return {
    hasMoved: () => moved,
    clear: () => {
      moved = false;
    }
  };
};
