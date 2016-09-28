#!/usr/bin/env node

var nlf = require('nlf');
var cArgs = require('command-line-args');

var uArgs = cArgs([
  { name: 'strict', alias: 's' , type: Boolean }
]);


nlf.find({ directory: '.' }, function (err, data) {
  var output = [ ];
  var errors = [ ];

  for (var x in data) {
    var licenseSources = data[x].licenseSources && data[x].licenseSources.licenses && data[x].licenseSources.licenses.sources ? data[x].licenseSources.licenses.sources : [ ];
    var packageSources = data[x].licenseSources && data[x].licenseSources.package && data[x].licenseSources.package.sources ? data[x].licenseSources.package.sources : [ ];

    var allSources = licenseSources.concat(packageSources);

    if (allSources.length === 0) errors.push('Could not find license for: ' + data[x].name + '. You will need to check it manually.');

    var sources = allSources.length > 0 ? allSources : [ { license: 'Unknown' } ];
    output.push('Dependency: ');
    output.push('  name: ' + data[x].name);
    output.push('  version: ' + data[x].version);
    output.push('  repository: ' + data[x].repository);
    output.push('  licenses: ' + sources.filter(function (source) {return source.license; }).map(function (source) { return source.license; }).join(', '));
    output.push('');
  }

  if (uArgs.strict === true && errors.length > 0) {
    console.error('Errors:\n  ' + errors.join('\n  '));
    process.exit(1);
  } else {
    console.log(output.join('\n'));
  }
});