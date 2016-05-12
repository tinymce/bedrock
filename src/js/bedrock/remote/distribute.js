var fs = require('fs');

var sequence = function (filename, f) {
  var contents = fs.readFileSync(filename);
  var browsers = JSON.parse(contents);

  var promises = browsers.map(function (b) {
    return f(b);
  });

  return Promise.all(promises);
};

module.exports = {
  sequence: sequence
};
