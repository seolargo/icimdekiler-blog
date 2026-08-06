import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve, normalize, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const yerelDir = join(dirname(fileURLToPath(import.meta.url)), 'yerel')

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

// Yerel-yalnız kütüphane: `yerel/` klasörü gitignore'da ve `public/` içinde
// olmadığı için derlemeye kopyalanmaz. Bu eklenti onu SADECE dev sunucusunda
// /yerel/... altından servis eder; üretimde böyle bir yol hiç var olmaz.
function yerelKutuphane() {
  return {
    name: 'yerel-kutuphane',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/yerel', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '').split('?')[0])
        // Her zaman yerelDir'e göre çöz ve sonucun gerçekten onun ALTINDA
        // kaldığını ayırıcıyla birlikte doğrula: '/yerel/../.env.local' ve
        // kodlanmış '..%2F' biçimleri dışarı çıkamaz.
        const file = resolve(yerelDir, '.' + normalize('/' + rel))
        if (
          !file.startsWith(yerelDir + sep) ||
          !existsSync(file) ||
          statSync(file).isDirectory()
        ) {
          return next()
        }
        res.setHeader(
          'Content-Type',
          file.endsWith('.json') ? 'application/json' : 'application/pdf',
        )
        createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), yerelKutuphane()],
  define: { __LAST_CHANGE__: JSON.stringify(lastChange) },
})
