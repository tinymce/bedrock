import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'lib/runner/ts/Runner.js',
  output: {
    file: 'dist/bedrock/www/runner/runner.js',
    format: 'iife',
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
