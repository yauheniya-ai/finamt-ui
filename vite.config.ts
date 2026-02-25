import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ],
  server: {
    proxy: {
      "/receipts":  "http://localhost:8000",
      "/databases": "http://localhost:8000",
      "/tax":       "http://localhost:8000",
      "/health":    "http://localhost:8000",
      "/config":    "http://localhost:8000",
    },
  },
})
