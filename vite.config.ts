import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import plainText from 'vite-plugin-plain-text'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      parserOpts: {
        plugins: [
          'decorators-legacy',
        ],
      },
    },
  }), plainText(/\.md$/)],
  build: {},
  esbuild: {},
  resolve: {
    alias: {
      'node:url': 'url',
      'universal-deep-strict-equal': 'src/shim/universal-deep-strict-equal.js'
    },
  },
  define: {
    process: {
      env: {
        'NODE_DEBUG': process.env.NODE_DEBUG,
      },
    },
  },
})
