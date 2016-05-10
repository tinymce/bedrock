var fs = require('fs');


// var browsers = JSON.parse(fs.readFileSync(params.sauceConfig));

var sequence = function (filename, f) {
  var contents = fs.readFileSync(filename);
  var browsers = JSON.parse(contents);

  var promises = browsers.map(function (b) {
    return f(b);
  });

  console.log('promises', promises.map(function (p) { return p.toString(); }));

  return Promise.all(promises);
};

module.exports = {
  sequence: sequence
};