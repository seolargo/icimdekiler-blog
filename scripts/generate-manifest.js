// public/pdfs/ klasörünü tarar ve public/posts.json manifestini üretir.
// Var olan girişlerin başlık/açıklama/tarih bilgilerini KORUR; sadece yeni
// PDF'ler için varsayılan giriş ekler. `npm run dev` ve `npm run build`
// öncesinde otomatik çalışır (predev/prebuild), ama elle de çalıştırabilirsin:
//   npm run manifest
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pdfDir = join(root, 'public', 'pdfs')
const thumbDir = join(root, 'public', 'thumbs')
const manifestPath = join(root, 'public', 'posts.json')

// PDF'in ilk sayfasından önizleme (PNG) üretir. macOS'ta `qlmanage` (Quick Look)
// kullanır; başka platformda ya da hata olursa sessizce atlar (thumb null olur).
function makeThumb(file, slug) {
  const out = join(thumbDir, `${slug}.png`)
  const rel = `thumbs/${slug}.png`
  if (existsSync(out)) return rel
  try {
    mkdirSync(thumbDir, { recursive: true })
    execFileSync('qlmanage', ['-t', '-s', '800', '-o', thumbDir, join(pdfDir, file)], {
      stdio: 'ignore',
    })
    // qlmanage çıktıyı "<dosyaadı>.png" olarak yazar; slug adına taşı
    const produced = join(thumbDir, `${file}.png`)
    if (existsSync(produced)) {
      renameSync(produced, out)
      return rel
    }
  } catch {
    // qlmanage yok / başarısız — önizlemesiz devam
  }
  return null
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

// Dosya adından okunabilir başlık üret
function titleize(name) {
  return name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const existing = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : []
const byPdf = new Map(existing.map((p) => [p.pdf, p]))

const files = existsSync(pdfDir)
  ? readdirSync(pdfDir).filter((f) => f.toLowerCase().endsWith('.pdf'))
  : []

const posts = files.map((file) => {
  const prev = byPdf.get(file)
  const slug = prev?.slug ?? slugify(file)
  const mtime = statSync(join(pdfDir, file)).mtime
  const base = prev ?? {
    slug,
    title: titleize(file),
    date: mtime.toISOString().slice(0, 10),
    description: '',
    pdf: file,
  }
  // önizleme eksikse (yeni PDF ya da eski manifest) üret
  const thumb = base.thumb ?? makeThumb(file, slug)
  // eklenme sırası: tam zaman damgası (bir kez atanır, korunur; eskiler mtime'dan doldurulur)
  const addedAt = base.addedAt ?? mtime.toISOString()
  return { ...base, thumb, addedAt }
})

// En son EKLENEN en üstte (eklenme zamanına göre)
posts.sort((a, b) => (a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0))

writeFileSync(manifestPath, JSON.stringify(posts, null, 2) + '\n')
console.log(`[manifest] ${posts.length} yazı yazıldı -> public/posts.json`)
