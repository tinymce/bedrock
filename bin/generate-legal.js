#!/usr/bin/env node

var nlf = require('nlf');

nlf.find({ directory: '.' }, function (err, data) {
  for (var x in data) {
    var sources = data[x].licenseSources && data[x].licenseSources.package && data[x].licenseSources.package.sources ? data[x].licenseSources.package.sources : [ { license: 'Unknown' } ];
    console.log('Dependency: ');
    console.log('  name: ' + data[x].name);
    console.log('  version: ' + data[x].version);
    console.log('  repository: ' + data[x].repository);
    console.log('  licenses: ' + sources.map(function (source) { return source.license; }).join(', '));
    console.log('');
  }
});
