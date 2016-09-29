var aws = require('aws-sdk');
var async = require('async');
var uploadtypes = require('./upload-types');

var upload = function (bucket, bucketfolder, targets) {
  return new Promise(function (resolve, reject) {
    var fileset = uploadtypes.scanAll(targets);

    console.log('Found approximately ' + fileset.length + ' files to upload');

    var counter = 0;

    var s3 = new aws.S3({
      params: {
        Bucket: bucket
      }
    });

    async.map(fileset, function (f, cb) {
      counter++;
      s3.upload({
        Key: bucketfolder + '/' + f.Key,
        Body: f.Body,
        ContentType: f.ContentType
      }, cb);
    }, function (err, results) {
      console.log('Uploaded: ' + counter + ' files.');
      if (err) {
        console.error('Error during upload', err);
        reject(err);
      } else {
        var base = 'http://' + bucket + '.s3-website-us-west-2.amazonaws.com/' + bucketfolder;
        resolve(base, results);
      }
    });
  });
};

module.exports = {
  upload: upload
};
