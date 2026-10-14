// Aşk yazılarını derler: content/ask/<slug>/{tr.md,en.md} -> public/ask.json
//
// Yazı biçimi (tr.md, en.md aynı):
//   ---
//   baslik: Yazının başlığı
//   tarih: 2026-10-14          (yalnızca tr.md'den okunur)
//   kapak: kapak.jpg           (yalnızca tr.md'den; public/ask/<slug>/ altında)
//   ozet: İsteğe bağlı kısa özet (yoksa ilk paragraftan üretilir)
//   ---
//   Paragraflar boş satırla ayrılır; paragraf içindeki tek satır sonu korunur.
//   ## Ara başlık          ### Küçük başlık
//   ![Resim altı yazısı](resim.jpg)   tek başına bir satırda: ortalı resim
//   > Alıntı               ---  ayraç
//   *italik*  **kalın**  [bağlantı](https://...)
//
// Aşk yazıları korpus değildir: BELGE numarası almaz, aramaya, kavram haritasına
// ve llms.txt'ye girmez.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'content', 'ask')
const outFile = join(root, 'public', 'ask.json')

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(s) {
  let h = esc(s)
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  return h
}

function parse(raw) {
  const meta = {}
  let body = raw.replace(/\r\n/g, '\n')
  const fm = body.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w+)\s*:\s*(.*)$/)
      if (m) meta[m[1]] = m[2].trim()
    }
    body = body.slice(fm[0].length)
  }
  return { meta, body: body.trim() }
}

function render(body, slug, problems) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  const html = []
  let firstText = ''
  for (const b of blocks) {
    const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (img) {
      const [, alt, file] = img
      if (!existsSync(join(root, 'public', 'ask', slug, file))) problems.push(`${slug}: resim yok: ${file}`)
      const src = `ask/${slug}/${file}`
      html.push(
        `<figure><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" />` +
          (alt ? `<figcaption>${inline(alt)}</figcaption>` : '') +
          `</figure>`,
      )
    } else if (/^###\s/.test(b)) html.push(`<h3>${inline(b.replace(/^###\s+/, ''))}</h3>`)
    else if (/^##\s/.test(b)) html.push(`<h2>${inline(b.replace(/^##\s+/, ''))}</h2>`)
    else if (/^---+$/.test(b)) html.push('<hr />')
    else if (/^>/.test(b)) {
      const q = b.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n')
      html.push(`<blockquote><p>${q.split('\n').map(inline).join('<br />')}</p></blockquote>`)
    } else {
      if (!firstText) firstText = b.replace(/\s+/g, ' ')
      html.push(`<p>${b.split('\n').map(inline).join('<br />')}</p>`)
    }
  }
  return { html: html.join('\n'), firstText }
}

const clip = (s, n = 220) => {
  const plain = s.replace(/\*+/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  if (plain.length <= n) return plain
  const cut = plain.slice(0, n)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

const problems = []
const items = []
const slugs = existsSync(srcDir)
  ? readdirSync(srcDir).filter((d) => statSync(join(srcDir, d)).isDirectory() && !d.startsWith('_'))
  : []

for (const slug of slugs) {
  const trPath = join(srcDir, slug, 'tr.md')
  if (!existsSync(trPath)) {
    problems.push(`${slug}: tr.md yok`)
    continue
  }
  const tr = parse(readFileSync(trPath, 'utf8'))
  const enPath = join(srcDir, slug, 'en.md')
  const en = existsSync(enPath) ? parse(readFileSync(enPath, 'utf8')) : null

  if (!tr.meta.baslik) problems.push(`${slug}: tr.md başlık yok`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tr.meta.tarih || '')) problems.push(`${slug}: tarih YYYY-AA-GG değil`)
  const cover = tr.meta.kapak ? `ask/${slug}/${tr.meta.kapak}` : null
  if (tr.meta.kapak && !existsSync(join(root, 'public', cover))) problems.push(`${slug}: kapak yok: ${tr.meta.kapak}`)

  const trR = render(tr.body, slug, problems)
  const enR = en ? render(en.body, slug, problems) : null

  items.push({
    slug,
    date: tr.meta.tarih,
    cover,
    tr: { title: tr.meta.baslik, excerpt: tr.meta.ozet || clip(trR.firstText), html: trR.html },
    en: en ? { title: en.meta.baslik, excerpt: en.meta.ozet || clip(enR.firstText), html: enR.html } : null,
  })
}

items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
if (problems.length) {
  console.error('[ask] SORUNLAR:\n  ' + problems.join('\n  '))
  process.exit(1)
}
writeFileSync(outFile, JSON.stringify(items, null, 2) + '\n')
console.log(`[ask] ${items.length} yazı -> public/ask.json`)
