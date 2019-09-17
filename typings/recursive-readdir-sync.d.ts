declare module 'recursive-readdir-sync' {
  function recursiveReaddirSync (directory: string): string[];
  export = recursiveReaddirSync;
}