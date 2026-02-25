import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['industrious-enchantment-production-b765.up.railway.app'],
  },
  server: {
    allowedHosts: ['industrious-enchantment-production-b765.up.railway.app'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

Commit that to `main`, Railway redeploys, and the login should be able to hit the backend.

---

**One more thing** — also add this to your **backend service → Variables** if it's not there already:
```
ALLOWED_ORIGINS=https://industrious-enchantment-production-b765.up.railway.app
