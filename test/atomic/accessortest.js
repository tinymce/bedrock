var tape = require('tape');

var accessor = require('../../src/js/bedrock/core/accessor.js');

tape('Testing basic accessor', function (t) {
  var obj = {
    alpha: 'Alpha'
  };
  var access = accessor.create([ 'alpha' ]);
  t.equal(access.alpha(obj), 'Alpha');
  t.end();
});