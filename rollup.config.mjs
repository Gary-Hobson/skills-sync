import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    banner: '#!/usr/bin/env node',
  },
  external: [
    /^node:/,
    /^fs$/,
    /^path$/,
    /^os$/,
    /^url$/,
    /^util$/,
    /^events$/,
    /^stream$/,
    /^crypto$/,
    /^child_process$/,
    /^readline$/,
    /^assert$/,
    /^buffer$/,
    /^process$/,
    /^tty$/,
    /^net$/,
    /^http$/,
    /^https$/,
    /^zlib$/,
  ],
  plugins: [
    resolve({ preferBuiltins: true, exportConditions: ['node'] }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'bundler',
        declaration: false,
      },
    }),
    terser({
      compress: { passes: 2 },
      mangle: { toplevel: true },
      format: { comments: false },
    }),
  ],
  onwarn(warning, warn) {
    // Suppress circular dependency warnings from dependencies
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
};
