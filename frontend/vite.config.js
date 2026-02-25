import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://iscale-facebook-ad-builder-production.up.railway.app/api/v1'),
  },
  preview: {
    allowedHosts: ['industrious-enchantment-production-b765.up.railway.app'],
  },
  server: {
    allowedHosts: ['industrious-enchantment-production-b765.up.railway.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
