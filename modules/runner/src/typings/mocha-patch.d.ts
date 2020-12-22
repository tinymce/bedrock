// The DefinitelyTyped mocha types are missing these functions because they are marked "private"
// however we need access to them to be able to do the chunking
declare namespace Mocha {
  interface Suite {
    hasOnly: () => boolean;
    filterOnly: () => void;
    markOnly: () => void;
  }
}