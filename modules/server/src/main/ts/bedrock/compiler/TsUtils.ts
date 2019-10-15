const hasTs = (srcFiles: string[]) => srcFiles.findIndex((fileName) => /(\.tsx?)$/.test(fileName)) !== -1;

export {
  hasTs
}