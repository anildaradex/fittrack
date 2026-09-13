import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local dev: proxy API calls to the FastAPI backend (port 8020).
    proxy: { '/api': 'http://localhost:8020' },
  },
})
