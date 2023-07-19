import { ChildProcess } from 'child_process';
import * as ExecUtils from '../util/ExecUtils';
import internal = require('stream');
import split2 = require('split2');

export interface Tunnel {
    url: URL;
    shutdown: () => Promise<void>;
}

const load = (subdomain: string, port: number): ExecUtils.ChildAPI => {
    // Installs tunnelmole in current node project. If testing on TinyMCE it will install in TinyMCE package.json.
    const exec = 'ssh';
    const args = ['-R', subdomain + ':80:localhost:' + port, 'sish.osu.tiny.work'];
    return ExecUtils.execLoader(exec, args);
};

const waitForReady = (proc: ChildProcess, timeout = 20000): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject('Tunnel creation took too long.'), timeout);
        const output = (proc.stdout ?? reject()) as internal.Readable;

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

export const create = async (port: number): Promise<Tunnel> => {
    const subdomain = crypto.randomUUID();
    const api = load(subdomain, port);
    const tunnelProc = api.start();
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
        return Promise.reject(e);
    }
};

