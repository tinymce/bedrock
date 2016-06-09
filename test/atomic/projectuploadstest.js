var uploads = require('../../src/js/bedrock/remote/project-uploads');
var tape = require('tape');




tape('Check uploading', function (t) {
  var actual = uploads.choose(
    {
      name: 'random.name',
      bucket: 'tbio-testing',
      uploaddirs: [ 'test/resources/alpha', 'test/resources/beta' ],
      basedir: 'base://',
      projectdir:  'project://',
      config: 'config/sample.js',
      testfiles: [
        'file1'
      ]
    }
  );
  t.deepEqual(actual, {
    name: 'random.name',
    bucket: 'tbio-testing',
    fileset: [
      { isDir: true, source: 'project:///test/resources/alpha', destination: 'project/test/resources/alpha' },
      { isDir: true, source: 'project:///test/resources/beta', destination: 'project/test/resources/beta' },
      { isFile: true, source: 'base://src/resources/runner.js', destination: 'js/runner.js' },
      { isFile: true, source: 'base://node_modules/@ephox/bolt/lib/kernel.js', destination: 'lib/bolt/kernel.js' },
      { isFile: true, source: 'base://node_modules/@ephox/bolt/lib/loader.js', destination: 'lib/bolt/loader.js' },
      { isFile: true, source: 'base://node_modules/@ephox/bolt/lib/module.js', destination: 'lib/bolt/module.js' },
      { isFile: true, source: 'base://node_modules/@ephox/bolt/lib/test.js', destination: 'lib/bolt/test.js' },
      { isFile: true, source: 'base://node_modules/jquery/dist/jquery.min.js', destination: 'lib/jquery/jquery.min.js' },
      { isFile: true, source: 'base://src/resources/bedrock.html', destination: 'index.html' },
      { isFile: true, source: 'base://src/css/bedrock.css', destination: 'css/bedrock.css' },
      { content: '{"config":"config/sample.js","scripts":["file1"]}', contentType: undefined, filename: 'harness' }
    ]
  });
  t.end();
});
