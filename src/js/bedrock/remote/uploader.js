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

    console.log('settings', settings);

    return;

    // var s3 = new aws.S3({
    //   params : {
    //     Bucket: settings.bucket
    //   }
    // });

    var directories = settings.directories;

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
