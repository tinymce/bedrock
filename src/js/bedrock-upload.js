var aws = require('aws-sdk');
var fs = require('fs');
var path = require('path');
var async = require('async');
var readdirSyncRec = require('recursive-readdir-sync');

var s3 = new aws.S3({
  params : {
    Bucket: 'tbio-testing'
  }
});

var directories = [
  'src',
  'node_modules',
  'bin'
];

var base = path.resolve('.');


var paths = directories.reduce(function (b, dir) {
  console.log('dir', dir);
  var dirPath = path.resolve(dir);
  return readdirSyncRec(dirPath).concat(b);
}, [ ]).map(function (f) {
  return {
    absolute: f,
    relative: f.substring(base.length)
  };
});

console.log('paths', paths);

var counter = 0;
async.map(paths, function (f, cb) {
  if (fs.lstatSync(f.absolute).isFile()) {
    counter++;
    s3.upload({
      Key: 'tunic' + f.relative,
      Body: fs.readFileSync(f.absolute)
    }, cb);
  } else {
    cb();
  }
}, function (err, results) {
    console.log('complete', counter);
    if (err) console.error(err);
    console.log(results);
});
