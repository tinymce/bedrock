import * as fs from 'fs';

export const readFileAsString = (p: fs.PathLike): string =>
  fs.readFileSync(p).toString();

export const readFileAsJson = (p: fs.PathLike): any =>
  JSON.parse(readFileAsString(p));
