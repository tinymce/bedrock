import * as fs from "fs";
import { PathLike } from 'fs';

export const readFileAsString = (p: PathLike): string =>
  fs.readFileSync(p).toString();

export const readFileAsJson = (p: PathLike): any =>
  JSON.parse(readFileAsString(p));
