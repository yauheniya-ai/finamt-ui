import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read version from pyproject.toml at build time
const pyprojectContent = readFileSync(resolve(__dirname, '../pypi/pyproject.toml'), 'utf-8')
const versionMatch = pyprojectContent.match(/^version\s*=\s*"(.+)"/m)
const packageVersion = versionMatch ? versionMatch[1] : 'unknown'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ],
  build: {
    outDir: "../pypi/src/finamt/ui/static",
    emptyOutDir: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
})
