import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'lib/runner/ts/Runner.js',
  output: {
    file: 'dist/bedrock/www/runner/runner.js',
    format: 'iife',
    name: 'runner',
    globals: {
      'jQuery': 'jQuery'
    },
  },
  context: 'window',
  plugins: [
    resolve(),
    commonjs()
  ]
};
