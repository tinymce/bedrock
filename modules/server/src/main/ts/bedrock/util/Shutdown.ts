export const registerShutdown = (cb: (code: number, immediate: boolean) => void): void => {
  const killEvents = ['exit', 'SIGTERM', 'SIGINT'];

  function register(evName: string) {
    process.on(evName as any, kill);
  }

  function unregister(evName: string) {
    process.removeListener(evName, kill);
  }

  function kill(code: number | string) {
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