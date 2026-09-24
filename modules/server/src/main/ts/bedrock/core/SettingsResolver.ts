export interface ResolvingSettings {
  readonly bucket: number;
  readonly buckets: number;
  readonly testfiles: string[];
  /** @deprecated Accepted and ignored. rspack is the only bundler. */
  readonly bundler?: string;
}

export const filterBuckets = (bucket: number, buckets: number, testfiles: string[]): string[] =>
  testfiles.filter((_x, i) => i % buckets === bucket - 1);

export const resolve = <T extends ResolvingSettings> (t: T): T => {
  const testfiles = filterBuckets(t.bucket, t.buckets, t.testfiles);

  return {
    ...t,
    testfiles
  };
};

export const log = <T extends ResolvingSettings> (t: T): void => {
  if (t.buckets > 1) {
    console.log(`Running bucket ${t.bucket} of ${t.buckets}: ${t.testfiles.length} files.`);
  }
  if (t.bundler !== undefined) {
    console.warn('Warning: --bundler is deprecated and ignored. rspack is the only bundler, so the option can be removed.');
  }
};

export const resolveAndLog = <T extends ResolvingSettings> (input: T): T => {
  const output = resolve(input);
  log(output);
  return output;
};
