import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // Add this block below your server block
  test: {
    globals: true,           // So you don't have to import 'describe' or 'expect'
    environment: 'jsdom',    // The virtual browser you installed
    //setupFiles: './src/setupTests.js', // The file that imports jest-dom
  },
})