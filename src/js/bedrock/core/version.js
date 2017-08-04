try {
  module.exports = 'v'+require('../../../../package.json').version;
}
catch (e) {
  module.exports = '';
}