import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // HTTPS de desarrollo solo con `npm run dev:https` (mode "https"): la cámara lo necesita.
  plugins: [react(), tailwindcss(), ...(mode === 'https' ? [basicSsl()] : [])],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
}))
