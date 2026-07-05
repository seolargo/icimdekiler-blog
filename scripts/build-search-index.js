// Tüm PDF'lerin metnini çıkarıp public/search-index.json üretir (tam metin arama).
// Artımlı: mevcut indekste bulunan slug'ları yeniden parse etmez; kaldırılanları atar.
// generate-manifest.js'ten SONRA çalışmalı (posts.json'a ihtiyaç duyar).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
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

const posts = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : []

const prev = existsSync(indexPath)
  ? new Map(JSON.parse(readFileSync(indexPath, 'utf8')).map((e) => [e.slug, e.body]))
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

const out = []
let parsed = 0
for (const p of posts) {
  let body = prev.get(p.slug)
  if (body == null) {
    try {
      body = fold(await extract(p.pdf)) // katlanmış (arama için hazır) metin
      parsed++
    } catch (e) {
      console.warn(`[search-index] ${p.pdf} okunamadı: ${e.message}`)
      body = ''
    }
  }
  out.push({ slug: p.slug, body })
}

writeFileSync(indexPath, JSON.stringify(out))
const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024)
console.log(
  `[search-index] ${out.length} yazı indekslendi (${parsed} yeni parse) -> public/search-index.json (${kb} KB)`,
)
