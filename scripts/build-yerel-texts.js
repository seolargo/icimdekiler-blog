// Yerel kütüphanedeki (yerel/pdfs) PDF'lerin düz metnini çıkarır:
//   yerel/texts/<slug>.txt          -> okunabilir tam metin
//   yerel/.fulltext-cache.json      -> artımlı çalışma için önbellek
//
// Amacı: yerel belgelerin içeriğine soru sorulabilmesi. Bu belgeler bilerek
// public/ dışında ve gitignore'da; çıktı da aynı yerde kalır, yayına çıkmaz.
// build-search-index.js'in kardeşi ama arama indeksi ÜRETMEZ — yerel belgeler
// site aramasına hiç girmez.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { clean } from './lib/clean.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const yerelDir = join(root, 'yerel')
const pdfDir = join(yerelDir, 'pdfs')
const manifestPath = join(yerelDir, 'posts.local.json')
const textsDir = join(yerelDir, 'texts')
const cachePath = join(yerelDir, '.fulltext-cache.json')

if (!existsSync(manifestPath)) {
  console.log('[yerel-metin] yerel/posts.local.json yok — atlanıyor.')
  process.exit(0)
}

const posts = JSON.parse(readFileSync(manifestPath, 'utf8'))
const prev = existsSync(cachePath)
  ? new Map(JSON.parse(readFileSync(cachePath, 'utf8')).map((e) => [e.slug, e.text]))
  : new Map()

async function extract(pdf) {
  const buf = readFileSync(join(pdfDir, pdf))
  const parser = new PDFParse({ data: new Uint8Array(buf) })
  try {
    const res = await parser.getText()
    return res.text || ''
  } finally {
    await parser.destroy?.()
  }
}

const fulltext = []
let parsed = 0
for (const p of posts) {
  let text = prev.get(p.slug)
  if (text == null) {
    try {
      text = clean(await extract(p.pdf))
      parsed++
    } catch (e) {
      console.warn(`[yerel-metin] ${p.pdf} okunamadı: ${e.message}`)
      text = ''
    }
  }
  fulltext.push({ slug: p.slug, text })
}

writeFileSync(cachePath, JSON.stringify(fulltext))
mkdirSync(textsDir, { recursive: true })
for (const e of fulltext) writeFileSync(join(textsDir, `${e.slug}.txt`), e.text)

// Kaldırılmış belgelerin artık dosyalarını temizle
const valid = new Set(fulltext.map((e) => e.slug))
for (const f of readdirSync(textsDir)) {
  if (!valid.has(f.replace(/\.txt$/, ''))) unlinkSync(join(textsDir, f))
}

const kc = fulltext.reduce((a, e) => a + e.text.length, 0)
console.log(
  `[yerel-metin] ${fulltext.length} yerel belge (${parsed} yeni parse), ` +
    `${kc.toLocaleString('tr-TR')} karakter -> yerel/texts/`,
)
