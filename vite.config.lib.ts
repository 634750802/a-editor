import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import visualizer from 'rollup-plugin-visualizer'
import typescript from '@rollup/plugin-typescript'
import tsConfig from './tsconfig.json'
import { resolve } from 'path'
import { dependencies, peerDependencies } from './package.json'

function isIn (source: string, dep: typeof dependencies | typeof peerDependencies): boolean | undefined {
  for (const key in dep) {
    if (source.startsWith(key)) {
      return true
    }
  }
  return undefined
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), typescript({ ...tsConfig.compilerOptions, rootDir: './src' }), visualizer()],
  base: 'https://634750802.github.io/a-editor/',
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      name: 'index',
      fileName: () => "index.js"
    },
    rollupOptions: {
      external: source => {
        return isIn(source, dependencies) || isIn(source, peerDependencies)
      },
    },
    sourcemap: true
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      // { find: 'node:url', replacement: 'url' },
      // { find: 'lodash', replacement: 'lodash-es' },
    ],
  },
})
