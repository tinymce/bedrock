// NOTE: Replace this with a sensible npm module if you can find one.

export const parse = function (url) {
  const questionIndex = url.indexOf('?');
  return questionIndex === -1 ? {
    base: url,
    original: url
  } : {
    base: url.substring(0, questionIndex),
    original: url
  };
};
