import { ChildProcess } from 'child_process';
import * as ExecUtils from '../util/ExecUtils';
import * as split2 from 'split2';
import * as crypto from 'node:crypto'; // Not needed with Node 19+
import { Tunnel as LambdaTunnel } from '@lambdatest/node-tunnel';

export interface Tunnel {
  url: URL;
  shutdown: () => Promise<void>;
}

const loadSSH = (subdomain: string, port: number | string): ExecUtils.ChildAPI => {
  const exec = 'ssh';
  const args = ['-R', subdomain + ':80:localhost:' + port, 'sish.osu.tiny.work'];
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
    wordStream.on('data', (data) => {
      console.log('Tunnel says:', data.toString());
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
const createSSH = async (port: number | string): Promise<Tunnel> => {  
  const subdomain = crypto.randomUUID();
  const api = loadSSH(subdomain, port);
  const tunnelProc = await api.start();
  if (tunnelProc == null) {
    throw new Error('Tunnel api returned null');
  }
  console.log('Tunnel process running. Waiting for URL...');

  try {
    await waitForReady(tunnelProc);
    const urlText = 'http://' + subdomain + '.sish.osu.tiny.work';
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
const createLambda = async (port: number | string): Promise<Tunnel> => {
  // This package has promise-based variants of all the functions but no type definitions for them
  const tunnel = new LambdaTunnel();

  const tunnelArguments = {
    user: process.env.LT_USERNAME,
    key: process.env.LT_ACCESS_KEY,
    port: port.toString()
  };
  
  const shutdown = async (): Promise<void> => {
    console.log('Shutting down tunnel...');
    return tunnel.stop((status, err) => {
      if (err) {
        console.error('Tunnel error when stopping:', err);
      }
      console.log('Tunnel exited cleanly?', status);
    });
  };

  const result: Tunnel = {
    url: new URL('http://localhost:' + port),
    shutdown
  };

  return new Promise((resolve, reject) => {
    tunnel.start(tunnelArguments, (err) => {
      err ? reject(err) : resolve(result);
    });
  });
};

export const create = async (remoteWebdriver: string, port: number | string): Promise<Tunnel> => {
  if (remoteWebdriver === 'lambdatest') {
    return createLambda(port);
  } else {
    return createSSH(port);
  }
};