// Aşk sözlüğü: content/ask-kavramlar.json'daki elle seçilmiş soyut kavramları
// Aşk yazılarında (content/ask/*/tr.md) sayar -> public/ask-kavramlar.json.
// Kayıt biçimi kavramlar.json ile aynıdır: { k, label, tf, df, s, top, variants, near }.
// "top" girişleri Aşk yazı slug'larıdır (bağlantı /ask/<slug>).
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'content', 'ask')
const listFile = join(root, 'content', 'ask-kavramlar.json')
const outFile = join(root, 'public', 'ask-kavramlar.json')

const lower = (s) => s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr')
const tokenize = (s) => lower(s).match(/[a-zçğıöşüâîû]+/g) || []

// yazılar: front-matter dışındaki gövde, başlık da sayılır
const docs = []
for (const slug of existsSync(srcDir) ? readdirSync(srcDir) : []) {
  const f = join(srcDir, slug, 'tr.md')
  if (!statSync(join(srcDir, slug)).isDirectory() || slug.startsWith('_') || !existsSync(f)) continue
  const raw = readFileSync(f, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const title = (m?.[1].match(/^baslik:\s*(.*)$/m) || [])[1] || ''
  docs.push({ slug, tokens: tokenize(title + '\n' + (m ? m[2] : raw)) })
}

const { kavramlar } = JSON.parse(readFileSync(listFile, 'utf8'))
const starts = (w, roots) => roots.some((r) => w.startsWith(lower(r)))

// her kavram için: belge -> eşleşen konumlar ve yüzey biçimleri
function matchAt(c, toks, i) {
  if (c.ifade) {
    for (const seq of c.ifade) {
      if (seq.every((r, j) => toks[i + j] && toks[i + j].startsWith(lower(r))))
        return toks.slice(i, i + seq.length).join(' ')
    }
    return null
  }
  const w = toks[i]
  if (c.haric?.map(lower).includes(w)) return null
  if (c.tam?.map(lower).includes(w)) return w
  return c.kok && starts(w, c.kok) ? w : null
}

const WINDOW = 12
const hits = new Map() // k -> [{slug, i}]
const records = []
for (const c of kavramlar) {
  const per = new Map()
  const forms = new Map()
  const pos = []
  for (const d of docs) {
    for (let i = 0; i < d.tokens.length; i++) {
      const s = matchAt(c, d.tokens, i)
      if (!s) continue
      per.set(d.slug, (per.get(d.slug) || 0) + 1)
      forms.set(s, (forms.get(s) || 0) + 1)
      pos.push({ slug: d.slug, i })
    }
  }
  hits.set(c.k, pos)
  const tf = pos.length
  if (!tf) continue
  records.push({
    k: c.k,
    label: c.k,
    tf,
    df: per.size,
    s: tf,
    top: [...per].sort((a, b) => b[1] - a[1]).slice(0, 5),
    variants: [...forms].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f),
  })
}

// komşular: aynı yazıda WINDOW kelime içinde birlikte geçen kavramlar
for (const r of records) {
  const co = new Map()
  for (const a of hits.get(r.k)) {
    for (const o of records) {
      if (o.k === r.k) continue
      if (hits.get(o.k).some((b) => b.slug === a.slug && Math.abs(b.i - a.i) <= WINDOW))
        co.set(o.k, (co.get(o.k) || 0) + 1)
    }
  }
  r.near = [...co].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k)
}

records.sort((a, b) => b.tf - a.tf || a.k.localeCompare(b.k, 'tr'))
const missing = kavramlar.filter((c) => !records.some((r) => r.k === c.k)).map((c) => c.k)
const tokens = docs.reduce((n, d) => n + d.tokens.length, 0)
const vocab = new Set(docs.flatMap((d) => d.tokens)).size
writeFileSync(
  outFile,
  JSON.stringify(
    { _not: 'scripts/build-ask-kavramlar.js üretir — elle düzenleme; liste content/ask-kavramlar.json', docs: docs.length, tokens, vocab, concepts: records },
    null,
    1,
  ) + '\n',
)
console.log(
  `[ask-kavramlar] ${records.length} kavram, ${docs.length} yazı -> public/ask-kavramlar.json` +
    (missing.length ? ` (hiç geçmeyen: ${missing.join(', ')})` : ''),
)
