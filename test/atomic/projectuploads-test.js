var uploads = require('../../src/js/bedrock/remote/project-uploads');
var tape = require('tape');




tape('Check uploading', function (t) {
  var actual = uploads.choose(
    {
      name: 'random.name',
      bucket: 'bedrock-testing',
      uploaddirs: [ 'test/resources/alpha', 'test/resources/beta' ],
      basedir: '${BASE}',
      projectdir:  '${PROJECT}',
      config: 'config/sample.js',
      testfiles: [
        'file1'
      ]
    }
  );
  t.deepEqual(actual, [
      { isDir: true, source: '${PROJECT}/test/resources/alpha', destination: 'project/test/resources/alpha' },
      { isDir: true, source: '${PROJECT}/test/resources/beta', destination: 'project/test/resources/beta' },
      { isFile: true, source: '${BASE}/src/resources/runner.js', destination: 'js/runner.js' },
      { isFile: true, source: '${BASE}/node_modules/@ephox/bolt/lib/kernel.js', destination: 'lib/bolt/kernel.js' },
      { isFile: true, source: '${BASE}/node_modules/@ephox/bolt/lib/loader.js', destination: 'lib/bolt/loader.js' },
      { isFile: true, source: '${BASE}/node_modules/@ephox/bolt/lib/module.js', destination: 'lib/bolt/module.js' },
      { isFile: true, source: '${BASE}/node_modules/@ephox/bolt/lib/test.js', destination: 'lib/bolt/test.js' },
      { isFile: true, source: '${BASE}/node_modules/jquery/dist/jquery.min.js', destination: 'lib/jquery/jquery.min.js' },
      { isFile: true, source: '${BASE}/src/resources/bedrock.html', destination: 'index.html' },
      { isFile: true, source: '${BASE}/src/css/bedrock.css', destination: 'css/bedrock.css' },
      { content: '{"config":"config/sample.js","scripts":["file1"]}', contentType: undefined, filename: 'harness' }
    ]
  );
  t.end();
});
