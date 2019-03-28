export const registerShutdown = function (cb: (code: number, immediate: boolean) => void) {
  const killEvents = ['exit', 'SIGTERM', 'SIGINT'];

  function register (evName) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    process.on(evName, kill);
  }

  function unregister (evName) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    process.removeListener(evName, kill);
  }

  function kill (code: number | string) {
    const immediate = typeof code === 'number';
    killEvents.forEach(unregister);
    if (typeof code === 'number') {
      cb(code, immediate);
    } else {
      cb(128, false);
    }
  }

  killEvents.forEach(register);
};