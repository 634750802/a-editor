import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import plainText from 'vite-plugin-plain-text'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), plainText(/\.md$/)],
  define: {
    process: {
      env: {}
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: 'node:url', replacement: 'url' },
      { find: 'universal-deep-strict-equal', replacement: 'src/shim/universal-deep-strict-equal.js' },
      { find: 'lodash', replacement: 'lodash-es' },
    ],
  },
})
