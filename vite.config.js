import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: mutlak yol gerekir (temiz URL + prerender edilen alt sayfalar için).
// Kök alan adı / Netlify / Vercel / GitHub user-site -> '/'.
// GitHub Pages proje sitesi (user.github.io/repo/) -> BASE_PATH=/repo/ ver.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
