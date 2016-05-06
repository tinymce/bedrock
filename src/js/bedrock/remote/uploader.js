/*
 * Settings
 *
 *
 * bucket: name of S3 bucket
 * directories: list of top-level directories to upload, (format: ??)
 * files: the list of files to upload (format: ??)
 */
var upload = function (settings) {
  return new Promise(function (resolve, reject) {
    var aws = require('aws-sdk');
    var fs = require('fs');
    var path = require('path');
    var async = require('async');
    var readdirSyncRec = require('recursive-readdir-sync');
    console.log('before');

    var fileset = settings.directories.reduce(function (rest, dir) {
      console.log('dir', dir);
      var d = path.resolve(dir.base);
      var files = readdirSyncRec(d);
      return files.map(function (f) {
        return {
          input: f,
          output: dir.prefix + (f.substring(dir.base.length))
        };
      });
    }, []).concat(settings.files);

    var counter = 0;

    var s3 = new aws.S3({
      params : {
        Bucket:  settings.bucket
      }
    });
    
    async.map(fileset, function (f, cb) {

      if (fs.lstatSync(f.input).isFile()) {
        counter++;
        s3.upload({
          Key: 'tunic/' + f.output,
          Body: fs.readFileSync(f.input)
        }, cb);
      } else {
        cb();
      }
    }, function (err, results) {
      console.log('complete', counter);
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log(results);
        resolve(results);
      }        
    });
  });
};

module.exports = {
  upload: upload
};


// var s3 = new aws.S3({
//   params : {
//     Bucket: 'tbio-testing'
//   }
// });

// var directories = [
//   'src',
//   'node_modules',
//   'bin'
// ];



// console.log('paths', paths);

// var counter = 0;
// async.map(paths, function (f, cb) {
//   if (fs.lstatSync(f.absolute).isFile()) {
//     counter++;
//     s3.upload({
//       Key: 'tunic' + f.relative,
//       Body: fs.readFileSync(f.absolute)
//     }, cb);
//   } else {
//     cb();
//   }
// }, function (err, results) {
//     console.log('complete', counter);
//     if (err) console.error(err);
//     console.log(results);
// });
