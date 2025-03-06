import { ChildProcess } from 'child_process';
import * as ExecUtils from '../util/ExecUtils';
import * as split2 from 'split2';
import * as crypto from 'node:crypto'; // Not needed with Node 19+
import { Tunnel as LambdaTunnel } from '@lambdatest/node-tunnel';

export interface Tunnel {
  url: URL;
  name?: string;
  shutdown: () => Promise<void>;
}

export interface LambdaCredentials {
  user: string;
  key: string;
}

const loadSSH = (subdomain: string, port: number | string, domain: string): ExecUtils.ChildAPI => {
  const exec = 'ssh';
  const args = ['-R', subdomain + ':80:localhost:' + port, domain];
  return ExecUtils.execLoader(exec, args);
};

const waitForReady = (proc: ChildProcess, timeout = 20000): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('Tunnel creation took too long.'), timeout);
    const output = proc.stdout;
    if (output === null) {
      reject('Tunnel did not yield a URL');
      return;
    }

    const wordStream = output.pipe(split2());
    wordStream.on('data', (_) => {
      // console.log('Tunnel says:', data.toString());
      // Stop listening. Even though it resolves instantly, this code block would otherwise
      // still be run on every data event.
      // wordStream.removeAllListeners('data');
      resolve();
    });
    proc.stderr?.on('data', (data) => {
      console.error('Tunnel error:', data.toString());
    });
    proc.on('close', (data) => {
      console.log('Tunnel closed', data);
    });
  });
};

// Connect to sish server @ sish.osu.tiny.work
const createSSH = async (port: number | string, domain: string): Promise<Tunnel> => {
  const subdomain = crypto.randomUUID();
  const api = loadSSH(subdomain, port, domain);
  const tunnelProc = await api.start();
  if (tunnelProc == null) {
    throw new Error('Tunnel api returned null');
  }
  console.log('Tunnel process running. Waiting for URL...');

  try {
    await waitForReady(tunnelProc);
    const urlText = 'https://' + subdomain + '.' + domain;
    console.log('Tunnel URL: ' + urlText);
    const url = new URL(urlText);

    // No waitForAlive. Webdriver creation waits for it and has its own connection timeout.
    const shutdown = async (): Promise<void> => {
      return new Promise((resolve) => {
        api.stop();
        resolve();
      });
    };

    return {
      url,
      shutdown
    };
  } catch (e) {
    api.stop();
    return Promise.reject('Tunnel Error: ' + e);
  }
};

// LambdaTest supplied tunnel
// @lambdatest/nodetunnel has some weird quasi-overriden promise-based versions of functions
// and no proper typing for it. Excuse the hard type casting
const createLambda = async (port: number | string, credentials: LambdaCredentials): Promise<Tunnel> => {
  const tunnel = new LambdaTunnel();
  const suffix = crypto.randomUUID();
  const tunnelName = 'bedrock-tunnel-' + suffix;

  const tunnelArguments = {
    tunnelName,
    user: credentials.user,
    key: credentials.key,
    port: port.toString()
  };

  const shutdown = async (): Promise<void> => {
    console.log('Shutting down tunnel...');
    return tunnel.stop(null as unknown as ((_: boolean) => void));
  };

  const result: Tunnel = {
    url: new URL('http://localhost:' + port),
    name: tunnelName,
    shutdown
  };

  const startPromise = tunnel.start(tunnelArguments, null as unknown as (() => void)) as unknown as Promise<boolean>;
  return startPromise.then((success) => {
      if (success) {
        return result;
      } else {
        return Promise.reject('Tunnel did not start correctly.');
      }
    });
};

const createTunnel = async (port: number, domain: string | undefined, credentials: LambdaCredentials): Promise<Tunnel> => {
  return domain ? createSSH(port, domain) : createLambda(port, credentials);
};

/**
 * Prepare Bedrock connection. Create a tunnel and shutdown methods if necessary
 *
 * @param port Dev server connection port
 * @param remote Name of remote service or undefined
 * @param domain Domain for sish connection or undefined
 * @returns Connection tunnel
 */
export const prepareConnection = async (port: number, remote: string | undefined, domain: string | undefined, credentials: LambdaCredentials ): Promise<Tunnel> => {
  return remote ? createTunnel(port, domain, credentials) : Promise.resolve({
    url: new URL('http://localhost:' + port),
    shutdown: () => Promise.resolve()
  });
};
