import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' -> relatif yollar. GitHub Pages / Netlify / Vercel her yerde çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
})
