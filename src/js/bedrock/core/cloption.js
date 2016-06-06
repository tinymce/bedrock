var fs = require('fs');
var readdirSyncRec = require('recursive-readdir-sync');

/* Really basic command line parsing ... nothing is optional, there are no flags */
var param = function (name, info, validate, short) {
  var p = function (args, o) {
    var value = args[0];
    validate(name, value);
    args.shift();
    o[name] = value;
  };

  return {
    p: p,
    name: name,
    info: info,
    short: short
  };
};

var usage = function (program, params) {
  var shortParams = params.map(function (p) {
    return p.short;
  }).join(' ');

  var paramHelp = params.map(function (p) {
    return '  ' + p.short + ': ' + p.info;
  }).join('\n\n');

  var output = 'usage: ' + program + ' ' + shortParams + '\n\n' + paramHelp + '\n';
  console.error('\n');
  console.error(output);
  process.exit(-1);
};

var parse = function (args, params, program) {
  var init = { };

  try {
    if (args.length - params.length < 0) throw new Error('Incorrect number of arguments: ' + args.length + '. Required ' + params.length + '+');
    params.forEach(function (p) {
      p.p(args, init);
    });
  } catch (err) {
    console.error(err.message !== undefined ? err.message : err);
    usage(program, params);
  }
  return init;
};

var validateFile = function (name, value) {
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
    return value;
  } catch (err) {
    throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file or ' + err);
  }
};

var isOneOf = function (values) {
  return function (name, value) {
    if (values.indexOf(value) === -1) throw new Error(
      'Invalid value for property: ' + name +
      '. Actual value: ' + value + '\nRequired values: one of ' + JSON.stringify(values)
    );
    return value;
  };
};

var isAny = function (name, value) {
  return value;
};

var files = function (name, info, short) {
  var p = function (args, o) {
    var set = args.slice(0);
    set.forEach(function (s) {
      validateFile(name + '.', s);
    });
    o[name] = set;
  };
  return {
    p: p,
    name: name,
    info: info,
    short: short
  };
};

var listDirectory = function (pattern) {
  return function (name, value) {
    return readdirSyncRec(value).filter(function (f) {
      return f.indexOf(pattern) >-1 && fs.lstatSync(f).isFile();
    });
  };
};

module.exports = {
  parse: parse,
  param: param,
  files: files,
  validateFile: validateFile,
  isAny: isAny,
  isOneOf: isOneOf,
  listDirectory: listDirectory
};
