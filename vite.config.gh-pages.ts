import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import plainText from 'vite-plugin-plain-text'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({}), plainText(/\.md$/)],
  base: 'https://634750802.github.io/a-editor/',
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: 'node:url', replacement: 'url' },
    ]
  },
})
