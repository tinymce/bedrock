import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'lib/main/ts/Runner.js',
  output: {
    file: 'dist/runner.js',
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
