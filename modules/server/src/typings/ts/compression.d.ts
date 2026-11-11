declare module 'compression' {
  import { IncomingMessage, ServerResponse } from 'http';

  type Filter = (request: IncomingMessage, response: ServerResponse) => boolean;

  interface CompressionOptions {
    readonly filter?: Filter;
  }

  function compression (options?: CompressionOptions): (request: IncomingMessage, response: ServerResponse, next: (err?: any) => void) => void;

  namespace compression {
    const filter: Filter;
  }

  export = compression;
}
