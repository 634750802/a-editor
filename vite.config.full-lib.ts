import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({})],
  base: 'https://634750802.github.io/a-editor/',
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      name: 'index',
      fileName: (format) => `index.full-es.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
    sourcemap: true,
    emptyOutDir: false,
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: 'node:url', replacement: 'url' },
      { find: 'lodash', replacement: 'lodash-es' },
    ],
  },
})
