import { ChildProcess } from 'child_process';
import * as ExecUtils from '../util/ExecUtils';
import internal = require('stream');
import split2 = require('split2');

export interface Tunnel {
    url: URL;
    shutdown: () => Promise<void>;
}

const load = (port: number | string): ExecUtils.ChildAPI => {
    const execCmd = 'npx';
    const execArgs = ['tmole', port.toString()];
    return ExecUtils.execLoader(execCmd, execArgs);
};

const waitForUrl = (proc: ChildProcess, timeout = 10000): Promise<string> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(), timeout);
        const output = (proc.stdout ?? reject()) as internal.Readable;
        let url;
        const wordStream = output.pipe(split2(' '));
        wordStream.on('data', (data) => {
            url = data.toString();

            // Stop listening. Even though it resolves instantly, this code block would otherwise
            // still be run on every data event.
            wordStream.removeAllListeners('data');
            resolve(url);
        });
    });
};

export const create = async (port: number): Promise<Tunnel> => {
    const api = load(port);
    const tunnelProc = api.start();

    try {
        const urlText = await waitForUrl(tunnelProc);
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

