var aws = require('aws-sdk');
var fs = require('fs');
var path = require('path');
var async = require('async');
var mime = require('mime');
var readdirSyncRec = require('recursive-readdir-sync');

var processDirs = function (directories) {
  return directories.reduce(function (rest, dir) {
    var d = path.resolve(dir.base);
    var files = readdirSyncRec(d);
    return files.map(function (f) {
      return {
        input: f,
        output: dir.prefix + (f.substring(dir.base.length))
      };
    });
  }, []);
};

/*
 * Settings
 *
 *
 * bucket: name of S3 bucket
 * directories: list of top-level directories to upload, (format: ??)
 * files: the list of files to upload (format: ??)
 * name: subdirectory to put on th bucket.
 */
var upload = function (settings) {
  return new Promise(function (resolve, reject) {
    var dirset = processDirs(settings.directories);
    var fileset = settings.files;
    var inlineset = settings.inline;

    var all = dirset.concat(fileset).concat(inlineset);

    console.log('Found approximately ' + all.length + ' files to upload (some may be directories)');

    var counter = 0;

    var s3 = new aws.S3({
      params : {
        Bucket:  settings.bucket
      }
    });
    
    async.map(all, function (f, cb) {      
      if (f.body !== undefined) {
        counter++;
        s3.upload({
          Key: 'tunic/' + settings.name + '/' + f.output,
          Body: f.body,
          ContentType: f.contentType
        }, cb);
      }
      else if (fs.lstatSync(f.input).isFile()) {        
        counter++;
        s3.upload({
          Key: 'tunic/' + settings.name + '/' + f.output,
          Body: f.body !== undefined ? f.body : fs.readFileSync(f.input),
          ContentType: f.contentType !== undefined ? f.contentType : mime.lookup(f.input)
        }, cb);
      } else {
        cb();
      }
    }, function (err, results) {
      console.log('Uploaded: ' + counter + ' files.');
      if (err) {
        console.error(err);
        reject(err);
      } else {
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
