var aws = require('aws-sdk');
var async = require('async');
var uploadtypes = require('./upload-types');

/*
 * Settings
 *
 *
 * bucket: name of S3 bucket
 * directories: list of top-level directories to upload, (format: ??)
 * files: the list of files to upload (format: ??)
 *
 * name: subdirectory to put on th bucket.
 */
var upload = function (settings) {
  return new Promise(function (resolve, reject) {
    var fileset = uploadtypes.scanAll(settings.fileset);

    console.log('Found approximately ' + fileset.length + ' files to upload');

    var counter = 0;

    var s3 = new aws.S3({
      params: {
        Bucket: settings.bucket
      }
    });

    async.map(fileset, function (f, cb) {
      counter++;
      s3.upload({
        Key: 'tunic/' + settings.name + '/' + f.Key,
        Body: f.Body,
        ContentType: f.ContentType
      }, cb);
    }, function (err, results) {
      console.log('Uploaded: ' + counter + ' files.');
      if (err) {
        console.error(err);
        reject(err);
      } else {
        var base = 'http://' + settings.bucket + '.s3-website-us-west-2.amazonaws.com/tunic/' + settings.name;
        resolve(base, results);
      }
    });
  });
};

module.exports = {
  upload: upload
};