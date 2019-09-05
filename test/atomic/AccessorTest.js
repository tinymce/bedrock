var tape = require('tape');

var Accessor = require('../../src/js/bedrock/core/Accessor.js');

tape('Testing basic accessor', function (t) {
  var obj = {
    alpha: 'Alpha'
  };
  var access = Accessor.create([ 'alpha' ]);
  t.equal(access.alpha(obj), 'Alpha');
  t.end();
});
