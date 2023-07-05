import { ChildProcess } from 'child_process';
import * as ExecUtils from '../util/ExecUtils';
import internal = require('stream');
import split2 = require('split2');

export interface Tunnel {
    url: URL;
    shutdown: () => Promise<void>;
}

const load = (): ExecUtils.ChildAPI => {
    // Installs tunnelmole in current node project. If testing on TinyMCE it will install in TinyMCE package.json.
    const exec = 'npx';
    const args = [ '--yes', 'tunnelmole'];
    return ExecUtils.execLoader(exec, args);
};

const waitForUrl = (proc: ChildProcess, timeout = 20000): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject('Tunnel could not be installed with npx.'), timeout);
        const output = (proc.stdout ?? reject()) as internal.Readable;
        let url;
        const wordStream = output.pipe(split2(' '));
        wordStream.on('data', (data) => {
            url = data.toString();
            console.log(data.toString());
            // Stop listening. Even though it resolves instantly, this code block would otherwise
            // still be run on every data event.
            wordStream.removeAllListeners('data');
            resolve(url);
        });
    });
};

export const create = async (port: number): Promise<Tunnel> => {
    const api = load();
    const tunnelProc = api.start([port.toString()]);
    console.log('Tunnel process running. Waiting for URL...');

    try {
        const urlText = await waitForUrl(tunnelProc);
        console.log('Tunnel URL: ' + urlText);
        const url = new URL(urlText);
        // await ExecUtils.waitForAlive(tunnelProc, port, 10000, actualUrl.toString());

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

