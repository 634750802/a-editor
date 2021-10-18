import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import plainText from 'vite-plugin-plain-text'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), plainText(/\.md$/)],
  define: {
    process: {
      env: {}
    }
  },
  resolve: {
    alias: {
      'node:url': 'url',
      'universal-deep-strict-equal': 'src/shim/universal-deep-strict-equal.js',
      'lodash': 'lodash-es'
    },
  },
})
