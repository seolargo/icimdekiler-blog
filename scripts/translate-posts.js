// Yazı başlık ve açıklamalarını İngilizceye çevirir ve posts.json'a
// title_en / description_en olarak yazar. Yalnızca EKSİK olanları çevirir
// (artımlı) — tekrar çalıştırmak yeni yazıları tamamlar, mevcutları korur.
//
// Çalıştırma (kendi anahtarınla):
//   ANTHROPIC_API_KEY=sk-... npm run translate
//   ANTHROPIC_API_KEY=... FORCE=1 npm run translate   # hepsini yeniden çevir
//   MODEL=claude-opus-5 ANTHROPIC_API_KEY=... npm run translate
//
// Not: Build hattının parçası DEĞİLDİR (anahtar/maliyet gerektirir). Elle çalıştırılır;
// ürettiği posts.json commit edilir. Slug'lar (URL) DEĞİŞMEZ — yalnızca görünen metin.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'public', 'posts.json')
const posts = JSON.parse(readFileSync(path, 'utf8'))

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('HATA: ANTHROPIC_API_KEY tanımlı değil. Örnek: ANTHROPIC_API_KEY=sk-... npm run translate')
  process.exit(1)
}
const model = process.env.MODEL || 'claude-sonnet-5'
const force = !!process.env.FORCE

// Çevrilecekler: title_en veya description_en eksik olanlar (FORCE ile hepsi)
const todo = posts.filter(
  (p) => force || !p.title_en || (p.description && !p.description_en),
)
if (!todo.length) {
  console.log('[translate] çevrilecek yeni yazı yok — hepsi güncel.')
  process.exit(0)
}

const { default: Anthropic } = await import('@anthropic-ai/sdk')
const client = new Anthropic({ apiKey })

const BATCH = 20 // istek başına yazı sayısı (bağlamı makul tut)
const sys =
  'Sen bir çevirmensin. Verilen Türkçe akademik makale başlıklarını ve özet açıklamalarını ' +
  'İngilizceye çevir. Ağırbaşlı, akıcı, akademik-ama-erişilebilir bir ton kullan. Terimleri ' +
  'yerleşik İngilizce karşılıklarıyla ver (ör. örtük bilgi → tacit knowledge, sınırlı bağlam → ' +
  'bounded context). Özel adları ve teknik terimleri koru. YALNIZCA geçerli JSON dizisi döndür.'

let done = 0
for (let i = 0; i < todo.length; i += BATCH) {
  const chunk = todo.slice(i, i + BATCH)
  const input = chunk.map((p, j) => ({ i: j, title: p.title, description: p.description || '' }))
  const prompt =
    'Aşağıdaki JSON dizisindeki her öğe için title ve description alanlarını İngilizceye çevir. ' +
    'Çıktı, her öğe için {"i": aynı indeks, "title_en": "...", "description_en": "..."} içeren ' +
    'bir JSON dizisi olsun (description boşsa description_en boş string). Başka metin yazma.\n\n' +
    JSON.stringify(input)
  const msg = await client.messages.create({
    model,
    max_tokens: 8000,
    system: sys,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  let arr
  try {
    arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1))
  } catch {
    console.error('HATA: parça ayrıştırılamadı. Ham yanıt:\n', text.slice(0, 500))
    process.exit(1)
  }
  for (const r of arr) {
    const p = chunk[r.i]
    if (!p) continue
    p.title_en = r.title_en || p.title_en
    if (p.description) p.description_en = r.description_en || p.description_en
    done++
  }
  console.log(`[translate] ${Math.min(i + BATCH, todo.length)}/${todo.length} işlendi…`)
}

writeFileSync(path, JSON.stringify(posts, null, 2) + '\n')
console.log(`[translate] ${done} yazı çevrildi -> public/posts.json (title_en/description_en)`)
