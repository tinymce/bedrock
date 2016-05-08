var write = function (results) {  
  // var failed = results.filter(function )
  // TODO: Return a promise.
  return new Promise(function (resolve, reject) {
    console.log('results1', results);
    resolve(results);
  });
};

module.exports = {
  write: write
};