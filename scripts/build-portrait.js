// Korpusu (başlık + açıklama + tema haritası) bir LLM'e okutup public/portrait.json
// üretir: "Bu yazar kim, nasıl düşünüyor, nelerden bahsediyor" portresi.
// Tam metin yerine elle yazılmış açıklamaları kullanır (~20k token) — çağrı ucuz ve hızlı.
//
// Çalıştırma (kendi anahtarınla):
//   ANTHROPIC_API_KEY=sk-... npm run portrait
// Model override:  MODEL=claude-opus-5 ANTHROPIC_API_KEY=... npm run portrait
//
// Not: Build hattının (predev/prebuild) PARÇASI DEĞİLDİR — maliyet ve anahtar gerektirir.
// Elle çalıştırılır; ürettiği portrait.json commit edilir ve statik servis edilir.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const posts = JSON.parse(readFileSync(join(root, 'public', 'posts.json'), 'utf8')).filter(
  (p) => !p.tab,
)
const themes = JSON.parse(readFileSync(join(root, 'public', 'themes.json'), 'utf8'))

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('HATA: ANTHROPIC_API_KEY tanımlı değil. Örnek: ANTHROPIC_API_KEY=sk-... npm run portrait')
  process.exit(1)
}
const model = process.env.MODEL || 'claude-sonnet-5'

const corpus = posts
  .map((p) => `- ${p.title}${p.description ? `\n  ${p.description}` : ''}`)
  .join('\n')
const themeList = themes.themes.map((t) => `- ${t.title}: ${t.blurb}`).join('\n')

const schema = `{
  "intro": "1-2 paragraf: yazar kim, nasıl düşünüyor (paragraflar arası \\n\\n)",
  "recurringIdeas": [{ "name": "kısa ad", "description": "1-2 cümle" }],
  "moves": ["yazarın karakteristik hamleleri, kısa cümleler"],
  "range": "kapsamı anlatan tek paragraf",
  "honestNote": "yağcı olmayan, dürüst bir gözlem: güçlü yön ve risk",
  "starters": [{ "slug": "posts.json'daki bir slug", "title": "başlık", "why": "neden buradan başlanmalı" }],
  "en": {
    "intro": "İngilizce çeviri (aynı içerik)",
    "recurringIdeas": [{ "name": "...", "description": "..." }],
    "moves": ["..."],
    "range": "...",
    "honestNote": "...",
    "starters": [{ "slug": "aynı slug", "title": "aynı Türkçe başlık", "why": "İngilizce" }]
  }
}`

const prompt = `Aşağıda tek bir yazarın ${posts.length} uzun makalesinin başlıkları ve özet açıklamaları var, ardından temaların haritası. Bu korpustan hareketle, siteye yeni gelen bir okuyucuya "bu yazar kim, nasıl düşünüyor, nelerden bahsetmiş" diye anlatan bir PORTRE üret.

Ton: ağırbaşlı, ölçülü, akademik-ama-erişilebilir Türkçe. YAĞCILIK YOK ("harika", "dahi" vb. kullanma). Dürüst ol; honestNote alanında hem güçlü yönü hem gerçek bir riski/zaafı belirt. Yazarı tek bir ekole indirgeme.

Yalnızca şu JSON şemasında, başka hiçbir metin olmadan yanıt ver:
${schema}

recurringIdeas 4-6 madde, moves 3-5 madde, starters 3-4 madde olsun. starters yalnızca aşağıdaki listede GEÇEN slug'ları kullanmalı. "en" alanı TR içeriğin İngilizce çevirisidir; starters başlıkları (title) Türkçe kalır (makale adları), yalnızca "why" İngilizceye çevrilir.

=== MAKALELER ===
${corpus}

=== TEMALAR ===
${themeList}`

const { default: Anthropic } = await import('@anthropic-ai/sdk')
const client = new Anthropic({ apiKey })

console.log(`[portrait] ${posts.length} makale -> ${model} ...`)
const msg = await client.messages.create({
  model,
  max_tokens: 4000,
  messages: [{ role: 'user', content: prompt }],
})
const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')

// JSON'u güvenli biçimde ayıkla (bazen ```json ... ``` sarmalı gelir)
const jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
let data
try {
  data = JSON.parse(jsonStr)
} catch (e) {
  console.error('HATA: yanıt JSON olarak ayrıştırılamadı. Ham yanıt:\n', text)
  process.exit(1)
}

// starters slug doğrulaması (hem TR hem EN)
const valid = new Set(posts.map((p) => p.slug))
const filterStarters = (obj, label) => {
  if (!obj || !Array.isArray(obj.starters)) return
  const before = obj.starters.length
  obj.starters = obj.starters.filter((s) => valid.has(s.slug))
  if (obj.starters.length !== before)
    console.warn(`[portrait] uyarı: ${before - obj.starters.length} geçersiz ${label} starter slug elendi`)
}
filterStarters(data, 'TR')
filterStarters(data.en, 'EN')

data.generatedAt = new Date().toISOString().slice(0, 10)
data.postCount = posts.length

writeFileSync(join(root, 'public', 'portrait.json'), JSON.stringify(data, null, 2) + '\n')
console.log(`[portrait] public/portrait.json yazıldı (${data.postCount} makaleden)`)
