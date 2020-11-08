const hasTs = (srcFiles: string[]): boolean =>
  srcFiles.findIndex((fileName) => /(\.tsx?)$/.test(fileName)) !== -1;

export {
  hasTs
};