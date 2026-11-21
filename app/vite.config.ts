import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    // 对外监听：手机真机要在同一局域网访问
    host: true,
  },
  build: {
    target: 'es2020',
  },
})
