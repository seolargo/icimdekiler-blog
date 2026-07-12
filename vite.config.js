import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// base: mutlak yol gerekir (temiz URL + prerender edilen alt sayfalar için).
// Kök alan adı / Netlify / Vercel / GitHub user-site -> '/'.
// GitHub Pages proje sitesi (user.github.io/repo/) -> BASE_PATH=/repo/ ver.

// Son değişiklik zamanı: son git commit tarihi; git yoksa (ör. Vercel build
// ortamında CLI deploy) derleme anı — yani yayına alma zamanı.
let lastChange = new Date().toISOString()
try {
  lastChange = execSync('git log -1 --format=%cI').toString().trim() || lastChange
} catch {
  // git yok — derleme anı kalır
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  define: { __LAST_CHANGE__: JSON.stringify(lastChange) },
})
