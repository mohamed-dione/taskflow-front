import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'taskflow-front-z3ku.vercel.app',
      'sb-30u4rjdosvyw.vercel.run',
      '.vercel.app',
      '.vercel.run',
    ],
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: [
      'taskflow-front-z3ku.vercel.app',
      'sb-30u4rjdosvyw.vercel.run',
      '.vercel.app',
      '.vercel.run',
    ],
  },
})