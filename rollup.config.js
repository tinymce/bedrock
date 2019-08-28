import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/runner/ts/Runner.ts',
  output: {
    file: 'dist/runner/runner.js',
    format: 'iife'
  },
  plugins: [
    typescript({
      "target": "es5",
      "module": "es2015",
      "lib": ["es2015", "dom"],
      include: "src/runner/ts"
    })
  ]
};
