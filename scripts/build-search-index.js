// Tüm PDF'lerin metnini çıkarır ve üç çıktı üretir:
//   1) public/search-index.json  -> katlanmış (folded) metin, istemci araması için
//   2) .fulltext-cache.json (kök) -> temizlenmiş okunabilir tam metin; prerender bunu
//      kullanarak llms-full.txt üretir (AI/LLM'lerin içeriği yutması için).
//   3) public/texts/<slug>.txt   -> yazı başına indirilebilir/kopyalanabilir düz metin
//      ("Metni Kopyala" / "Metni İndir" butonları için).
// Artımlı: her iki önbellekte de bulunan slug'lar yeniden parse edilmez.
// generate-manifest.js'ten SONRA çalışmalı (posts.json'a ihtiyaç duyar).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { fold } from '../src/search.js'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = join(root, 'public', 'pdfs')
const manifestPath = join(root, 'public', 'posts.json')
const indexPath = join(root, 'public', 'search-index.json')
const fulltextPath = join(root, '.fulltext-cache.json')
const textsDir = join(root, 'public', 'texts')

// LaTeX/PDF çıkarımındaki Türkçe karakter bozulmalarını okunabilir hale getirir.
// (Bazı 'ı/İ' harfleri çıkarımda tamamen düştüğü için en iyi çaba düzeyindedir.)
function clean(s) {
  return (s || '')
    .replace(/¸\s?c/g, 'ç').replace(/¸\s?C/g, 'Ç')
    .replace(/¸\s?s/g, 'ş').replace(/¸\s?S/g, 'Ş')
    .replace(/¨\s?u/g, 'ü').replace(/¨\s?U/g, 'Ü')
    .replace(/¨\s?o/g, 'ö').replace(/¨\s?O/g, 'Ö')
    .replace(/¨\s?ı/g, 'i').replace(/¨\s?i/g, 'i')
    .replace(/˘\s?g/g, 'ğ').replace(/˘\s?G/g, 'Ğ')
    .replace(/ˆ\s?a/g, 'â').replace(/ˆ\s?ı/g, 'ı')
    .replace(/³/g, 'ş')
    .replace(/§/g, 'ğ')
    .replace(/[¸¨˘ˆ]/g, '') // kalan birleştiriciler
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const posts = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : []

const prevFolded = existsSync(indexPath)
  ? new Map(JSON.parse(readFileSync(indexPath, 'utf8')).map((e) => [e.slug, e.body]))
  : new Map()
const prevText = existsSync(fulltextPath)
  ? new Map(JSON.parse(readFileSync(fulltextPath, 'utf8')).map((e) => [e.slug, e.text]))
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

const index = []
const fulltext = []
let parsed = 0
for (const p of posts) {
  let folded = prevFolded.get(p.slug)
  let text = prevText.get(p.slug)
  if (folded == null || text == null) {
    try {
      const raw = await extract(p.pdf)
      folded = fold(raw)
      text = clean(raw)
      parsed++
    } catch (e) {
      console.warn(`[search-index] ${p.pdf} okunamadı: ${e.message}`)
      folded = folded ?? ''
      text = text ?? ''
    }
  }
  index.push({ slug: p.slug, body: folded })
  fulltext.push({ slug: p.slug, text })
}

writeFileSync(indexPath, JSON.stringify(index))
writeFileSync(fulltextPath, JSON.stringify(fulltext))

// Yazı başına düz metin dosyaları (kopyala/indir butonları için)
mkdirSync(textsDir, { recursive: true })
const validSlugs = new Set(fulltext.map((e) => e.slug))
for (const e of fulltext) {
  writeFileSync(join(textsDir, `${e.slug}.txt`), e.text)
}
// Kaldırılmış yazıların artık dosyalarını temizle
for (const f of readdirSync(textsDir)) {
  const slug = f.replace(/\.txt$/, '')
  if (!validSlugs.has(slug)) unlinkSync(join(textsDir, f))
}

const kb = Math.round(Buffer.byteLength(JSON.stringify(index)) / 1024)
console.log(
  `[search-index] ${index.length} yazı indekslendi (${parsed} yeni parse) -> search-index.json (${kb} KB) + .fulltext-cache.json + public/texts/`,
)
