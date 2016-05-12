var mime = require('mime');
var readdirSyncRec = require('recursive-readdir-sync');
var fs = require('fs');
var path = require('path');

var uploadtype = function (key, body, contentType) {
  return {
    Key: key,
    Body: body,
    ContentType: contentType
  };
};

var filetype = function (source, destination) {
  return {
    isFile: true,
    source: source,
    destination: destination
  };
};

var dirtype = function (source, destination) {
  return {
    isDir: true,
    source: source,
    destination: destination
  };
};

var datatype = function (filename, content, contentType) {
  return {
    filename: filename,
    content: content,
    contentType: contentType
  };
};

var scanFile = function (file) {
  var body = fs.readFileSync(file.source);
  var contentType = mime.lookup(file.source);
  return uploadtype(file.destination, body, contentType);
};

var scanDir = function (dir) {
  var d = path.resolve(dir.source);
  var files = readdirSyncRec(d).filter(function (f) {
    return fs.lstatSync(f).isFile();
  });

  return files.map(function (f) {
    var type = filetype(f, dir.destination + f.substring(dir.source.length));
    return scanFile(type);
  });
};

var scanData = function (data) {
  console.log('scanning', data);
  return uploadtype(data.filename, data.content, data.contentType);
};

var scan = function (item) {
  if (item.isFile) return [ scanFile(item) ];
  else if (item.isDir) return scanDir(item);
  return [ scanData(item) ];
};

var scanAll = function (items) {
  return items.reduce(function (rest, item) {
    return rest.concat(scan(item));
  }, [ ]);
};

module.exports = {
  scanAll: scanAll,
  datatype: datatype,
  dirtype: dirtype,
  filetype: filetype
};
