import { resolve } from 'path'
import packageJson from './package.json'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import { terser } from 'rollup-plugin-terser'
import ts from "rollup-plugin-ts";

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm'
      },
      {
        file: 'dist/index.esm.min.js',
        format: 'esm',
        plugins: [terser()]
      }
    ],
    external: Object.keys(packageJson.dependencies),
    plugins: [
      ts({}),
      alias({
        entries: [
          { find: 'node:url', replacement: 'url' }
        ]
      }),
      nodeResolve({
        preferBuiltins: false,
        browser: true
      }),
      nodePolyfills(),
      commonjs()
    ]
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.esm-full.js',
        format: 'esm'
      },
      {
        file: 'dist/index.esm-full.min.js',
        format: 'esm',
        plugins: [terser()]
      }
    ],
    plugins: [
      ts({}),
      alias({
        entries: [
          { find: 'node:url', replacement: 'url' }
        ]
      }),
      nodeResolve({
        preferBuiltins: false,
        browser: true
      }),
      nodePolyfills(),
      commonjs()
    ],
    resolve: {
      alias: [
        { find: 'decode-named-character-reference', replacement: 'node_modules/decode-named-character-reference/index.js' }
      ],
    },
  }, {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs'
    },
    plugins: [
      ts({}),
      alias({
        entries: [
          { find: 'node:url', replacement: 'url' }
        ]
      }),
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs()
    ]
  }])

