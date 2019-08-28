import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'lib/runner/ts/Runner.js',
  output: {
    file: 'dist/runner/runner.js',
    format: 'iife',
    name: 'runner',
    globals: {
      'jquery': 'jquery'
    },
  },
  context: 'window',
  plugins: [
    resolve()
  ]
};
