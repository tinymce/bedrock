// NOTE: Replace this with a sensible npm module if you can find one.

var parse = function (url) {
  var questionIndex = url.indexOf('?');
  return questionIndex === -1 ? {
    base: url,
    original: url
  } : {
    base: url.substring(0, questionIndex),
    original: url
  };
};


module.exports = {
  parse: parse
};