import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Electron falls back to dist/index.html when launched without Vite.
  // Relative asset URLs keep the packaged renderer working under file://.
  base: './',
  plugins: [react()],
})
