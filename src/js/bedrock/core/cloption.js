var fs = require('fs');

/* Really basic command line parsing ... nothing is optional, there are no flags */
var param = function (name, info, validate) {
  return function (args, o) {
    var value = args[0];
    validate(name, value);
    args.shift();
    o[name] = value;
  };
};

var parse = function (args, params, num, error) {
  var init = { };
  if (args.length - params.length < 0) throw new Error('Not enough arguments. ' + error);
  params.map(function (p) {
    p(args, init);
  });
  return init;
};

var validateFile = function (name, value) {
  if (!fs.existsSync(value)  && fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
};

var isAny = function (name, value) {
  return true;
};

var files = function (name, info) {
  return function (args, o) {
    var set = args.slice(0);
    set.forEach(function (s) {
      validateFile(name + '.', s);
    });
    o[name] = set;
  };
};

module.exports = {
  parse: parse,
  param: param,
  files: files,
  validateFile: validateFile,
  isAny: isAny
};