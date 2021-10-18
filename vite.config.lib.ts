import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import visualizer from 'rollup-plugin-visualizer'
import typescript from '@rollup/plugin-typescript'
import tsConfig from './tsconfig.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), typescript({ ...tsConfig.compilerOptions, rootDir: './src' }), visualizer()],
  base: 'https://634750802.github.io/a-editor/',
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      name: "index",
      fileName: () => "index.js"
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
  resolve: {
    alias: {
      'node:url': 'url',
      'lodash': 'lodash-es',
    },
  },
})
