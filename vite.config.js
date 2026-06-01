import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        infos: resolve(__dirname, 'infos.html')
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  }
})
