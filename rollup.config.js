import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'dist/lib/runner/ts/Runner.js',
  output: {
    file: 'dist/www/runner/runner.js',
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
