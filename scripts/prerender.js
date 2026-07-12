// vite build sonrası çalışır: her rota için gerçek statik HTML üretir.
// - <head>: title, description, canonical, Open Graph, Twitter, JSON-LD
// - #root: JS olmadan da görünen gerçek içerik (crawler + no-JS için)
// - sitemap.xml, robots.txt ve hosting fallback'leri (_redirects, 404.html)
//
// Yapılandırma (ortam değişkenleri):
//   SITE_URL   -> yayınlanacak tam adres, ör. https://ornek.com  (canonical/sitemap için)
//   BASE_PATH  -> alt dizinde barındırma yolu, ör. /repo/ (vite.config.js ile aynı)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '/') // sonu '/' garanti
const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/+$/, '')
const SITE_NAME = 'Ömer Faruk Yavuz'
const SITE_ROLE = 'Bilgisayar Mühendisi, Yıldız Teknik Üniversitesi' // no-JS varsayılan: TR
const SITE_DESCRIPTION =
  'Ömer Faruk Yavuz — mühendislik, tasarım ve sistem düşüncesi üzerine PDF makaleler.'

if (!process.env.SITE_URL) {
  console.warn(
    '[prerender] UYARI: SITE_URL ayarlı değil, placeholder https://example.com kullanılıyor.\n' +
      '            Yayından önce: SITE_URL=https://alanadin.com npm run build',
  )
}

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s = '') => esc(s).replace(/"/g, '&quot;')
const asset = (p) => base + p.replace(/^\/+/, '') // base ile birleştir

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const posts = JSON.parse(readFileSync(join(dist, 'posts.json'), 'utf8'))

// Tam metin önbelleği (build-search-index.js üretir) — llms-full.txt için
const fulltextPath = join(root, '.fulltext-cache.json')
const fulltext = existsSync(fulltextPath)
  ? new Map(JSON.parse(readFileSync(fulltextPath, 'utf8')).map((e) => [e.slug, e.text]))
  : new Map()

// --- ortak parçalar -------------------------------------------------------
function header(active) {
  const tab = (href, label, key) =>
    `<a href="${href}" class="nav-tab${active === key ? ' active' : ''}">${label}</a>`
  return `<div class="site">` +
    `<div class="lang-switch" role="group" aria-label="Dil / Language">` +
    `<button type="button" class="lang-btn is-active">TR</button>` +
    `<span class="lang-sep">/</span>` +
    `<button type="button" class="lang-btn">EN</button></div>` +
    `<header class="site-header"><a href="${base}" class="brand">` +
    `<img class="brand-photo" src="${asset('profile.jpeg')}" alt="${escAttr(SITE_NAME)}" />` +
    `<span class="brand-name">${esc(SITE_NAME)}</span>` +
    `<span class="brand-role">${esc(SITE_ROLE)}</span>` +
    `<span class="brand-title">İçimdekiler</span>` +
    `</a></header>` +
    `<nav class="site-nav" aria-label="Bölümler">` +
    tab(base, 'Yazılar', 'yazilar') +
    tab(base + 'muzik', 'Müzik', 'muzik') +
    `</nav>` +
    `<main class="site-main">`
}
// Son değişiklik zamanı: son git commit tarihi; git yoksa (ör. Vercel build) derleme anı.
let LAST_CHANGE = new Date().toISOString()
try {
  LAST_CHANGE = execSync('git log -1 --format=%cI').toString().trim() || LAST_CHANGE
} catch {
  // git yok — derleme anı kalır
}
const lastChangeText = new Date(LAST_CHANGE).toLocaleString('tr-TR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Istanbul', // build makinesi UTC olabilir (ör. Vercel)
})

const footer = () =>
  `</main><footer class="site-footer"><span>© ${new Date().getFullYear()} ${esc(SITE_NAME)}</span>` +
  `<span class="footer-updated">Son güncelleme: ${esc(lastChangeText)}</span></footer></div>`

const introHtml =
  '<section class="intro">' +
  '<p>Yazılım mühendisliğinde bilişsel evrim çerçevesini uyguluyorum — benzerlik tanıma, kümeleme, görsel ve soyut düşünme, modüler ve genelleştirilmiş tasarımdan; evrimsel, niyet-odaklı ve düşünümsel-uyarlanabilir sistem düşüncesine ve kendini geliştiren mimarilere uzanan bir yelpazede.</p>' +
  '<p>Öğrenen, evrilen ve insanın niyet ve ihtiyaçlarıyla hizalanan sistemler kurmaya odaklıyım.</p>' +
  '<p class="intro-quote">Her problem, mühendisliğe ulaşmadan önce tasarımda çözülmelidir — açıklık koddan daha iyi ölçeklenir.</p>' +
  '</section>'

function postListItem(p) {
  const thumb = p.thumb
    ? `<img class="post-thumb" src="${asset(p.thumb)}" alt="" loading="lazy" />`
    : ''
  const meta = [p.series, p.pages > 0 ? `${p.pages} sayfa` : null].filter(Boolean).join(' · ')
  const ser = meta ? `<span class="post-series">${esc(meta)}</span>` : ''
  const desc = p.description ? `<span class="post-desc">${esc(p.description)}</span>` : ''
  return (
    `<li class="post-item"><a href="${base}post/${encodeURIComponent(p.slug)}" class="post-link">` +
    thumb +
    `<div class="post-body"><span class="post-title">${esc(p.title)}</span>` +
    ser +
    desc +
    `</div></a></li>`
  )
}

// --- <head> enjeksiyonu ----------------------------------------------------
function buildHead({ title, description, canonical, type, image, jsonLd }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const img = SITE_URL + (image || '/profile.jpeg')
  const tags = [
    `<link rel="canonical" href="${escAttr(canonical)}" />`,
    `<meta property="og:site_name" content="${escAttr(SITE_NAME)}" />`,
    `<meta property="og:type" content="${escAttr(type)}" />`,
    `<meta property="og:title" content="${escAttr(fullTitle)}" />`,
    `<meta property="og:description" content="${escAttr(description)}" />`,
    `<meta property="og:url" content="${escAttr(canonical)}" />`,
    `<meta property="og:image" content="${escAttr(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escAttr(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escAttr(description)}" />`,
    `<meta name="twitter:image" content="${escAttr(img)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${escAttr(SITE_NAME)}" href="${escAttr(SITE_URL + base + 'feed.xml')}" />`,
  ]
  if (jsonLd) {
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json">${json}</script>`)
  }
  return { fullTitle, description, extra: tags.join('\n    ') }
}

// template'i verilen sayfa için özelleştir
function renderPage({ head, bodyHtml }) {
  let html = template
  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(head.fullTitle)}</title>`)
  // description meta
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escAttr(head.description)}" />`,
  )
  // ek head etiketleri
  html = html.replace('</head>', `    ${head.extra}\n  </head>`)
  // içerik
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  return html
}

function write(fileRelDir, html) {
  const dir = join(dist, fileRelDir)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

// --- ANA SAYFA -------------------------------------------------------------
const homeHead = buildHead({
  title: '',
  description: SITE_DESCRIPTION,
  canonical: SITE_URL + base,
  type: 'website',
  image: '/profile.jpeg',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL + base,
    author: { '@type': 'Person', name: SITE_NAME, jobTitle: SITE_ROLE },
  },
})
const writings = posts.filter((p) => p.tab !== 'muzik') // Müzik sekmesi hariç
const musicPosts = posts.filter((p) => p.tab === 'muzik')
const homeBody =
  header('yazilar') +
  introHtml +
  `<ul class="post-list">${writings.map(postListItem).join('')}</ul>` +
  footer()
writeFileSync(join(dist, 'index.html'), renderPage({ head: homeHead, bodyHtml: homeBody }))

// --- MÜZİK SEKMESİ ---------------------------------------------------------
const muzikHead = buildHead({
  title: 'Müzik',
  description: 'Müzik teorisi ve pratik akor notları.',
  canonical: `${SITE_URL}${base}muzik`,
  type: 'website',
  image: '/profile.jpeg',
})
const muzikBody =
  header('muzik') +
  `<ul class="post-list">${musicPosts.map(postListItem).join('')}</ul>` +
  footer()
write('muzik', renderPage({ head: muzikHead, bodyHtml: muzikBody }))

// --- YAZI SAYFALARI --------------------------------------------------------
for (const p of posts) {
  const canonical = `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`
  const pdfUrl = asset(`pdfs/${p.pdf}`)
  const head = buildHead({
    title: p.title,
    description: p.description || SITE_DESCRIPTION,
    canonical,
    type: 'article',
    image: p.thumb ? `/${p.thumb}` : '/profile.jpeg',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.title,
      description: p.description || undefined,
      datePublished: p.date || undefined,
      author: { '@type': 'Person', name: SITE_NAME },
      mainEntityOfPage: canonical,
      url: canonical,
    },
  })
  const lead = p.description ? `<p class="post-lead">${esc(p.description)}</p>` : ''
  const isMusic = p.tab === 'muzik'
  const backHref = isMusic ? base + 'muzik' : base
  const backLabel = isMusic ? '← Müzik' : '← Tüm yazılar'
  const body =
    header(isMusic ? 'muzik' : 'yazilar') +
    `<article class="post">` +
    `<a href="${escAttr(backHref)}" class="back-link">${backLabel}</a>` +
    `<div class="post-head"><div><h1 class="post-heading">${esc(p.title)}</h1>${lead}</div></div>` +
    (p.note ? `<p class="post-note">${esc(p.note)}</p>` : '') +
    `<div class="post-actions">` +
    `<a href="${escAttr(pdfUrl)}" target="_blank" rel="noreferrer" class="btn">Yeni sekmede aç</a>` +
    `<a href="${escAttr(pdfUrl)}" download class="btn">İndir</a>` +
    `<button type="button" class="btn">Paylaş</button>` +
    `</div>` +
    `<div class="pdf-frame"><iframe title="${escAttr(p.title)}" src="${escAttr(pdfUrl)}"></iframe></div>` +
    `</article>` +
    footer()
  write(`post/${p.slug}`, renderPage({ head, bodyHtml: body }))
}

// --- sitemap.xml -----------------------------------------------------------
const urls = [
  { loc: SITE_URL + base, lastmod: posts[0]?.date },
  { loc: `${SITE_URL}${base}muzik` },
  ...posts.map((p) => ({
    loc: `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`,
    lastmod: p.date,
  })),
]
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url><loc>${escAttr(u.loc)}</loc>` +
        (u.lastmod ? `<lastmod>${escAttr(u.lastmod)}</lastmod>` : '') +
        `</url>`,
    )
    .join('\n') +
  '\n</urlset>\n'
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

// --- robots.txt (AI botlarına açık izin) -----------------------------------
// Site, yapay zeka sistemleri tarafından keşfedilsin diye bilinen AI crawler'lara
// açıkça izin verir. llms.txt ve sitemap konumları da burada bildirilir.
const aiBots = [
  'GPTBot', // OpenAI eğitim/crawler
  'OAI-SearchBot', // OpenAI arama
  'ChatGPT-User', // ChatGPT tarama
  'ClaudeBot', // Anthropic
  'anthropic-ai',
  'Claude-Web',
  'PerplexityBot', // Perplexity
  'Perplexity-User',
  'Google-Extended', // Gemini/Bard
  'Applebot-Extended', // Apple Intelligence
  'CCBot', // Common Crawl (birçok LLM veri kaynağı)
  'Meta-ExternalAgent', // Meta AI
  'Bytespider', // TikTok/ByteDance
  'Amazonbot',
  'cohere-ai',
  'YouBot',
  'Diffbot',
]
const robots =
  aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n') +
  '\n\nUser-agent: *\nAllow: /\n\n' +
  `# LLM içerik haritası (özet + tam metin)\n` +
  `# ${SITE_URL}${base}llms.txt\n# ${SITE_URL}${base}llms-full.txt\n\n` +
  `Sitemap: ${SITE_URL}${base}sitemap.xml\n`
writeFileSync(join(dist, 'robots.txt'), robots)

// --- llms.txt (llmstxt.org): LLM'ler için temiz, markdown site haritası ------
const llms =
  `# ${SITE_NAME}\n\n` +
  `> ${SITE_DESCRIPTION}\n\n` +
  `${SITE_NAME} — ${SITE_ROLE}. Aşağıda tüm makaleler, başlık, kısa açıklama ve ` +
  `kalıcı bağlantılarıyla listelenmiştir. Her makalenin tam metni bağlantıdaki ` +
  `PDF'te ve toplu olarak ${SITE_URL}${base}llms-full.txt dosyasında yer alır.\n\n` +
  `## Makaleler\n\n` +
  (() => {
    // serilere göre grupla (yazı sırasındaki ilk görülme sırasıyla)
    const groups = []
    const idx = new Map()
    for (const p of posts) {
      const key = p.series || 'Diğer'
      if (!idx.has(key)) {
        idx.set(key, groups.length)
        groups.push({ name: key, items: [] })
      }
      groups[idx.get(key)].items.push(p)
    }
    return groups
      .map(
        (g) =>
          `### ${g.name}\n\n` +
          g.items
            .map((p) => {
              const url = `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`
              const d = p.description ? `: ${p.description}` : ''
              return `- [${p.title}](${url})${d}`
            })
            .join('\n'),
      )
      .join('\n\n')
  })() +
  '\n'
writeFileSync(join(dist, 'llms.txt'), llms)

// --- llms-full.txt: tüm makalelerin OKUNABİLİR tam metni (AI/LLM yutumu için) --
if (fulltext.size) {
  const full =
    `# ${SITE_NAME} — Tam Metin\n\n` +
    `> ${SITE_DESCRIPTION}\n\n` +
    `Bu dosya tüm makalelerin tam metnini içerir. Kaynak PDF'lerden çıkarılmıştır; ` +
    `bazı Türkçe karakterler çıkarım nedeniyle eksik olabilir.\n\n` +
    posts
      .map((p) => {
        const url = `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`
        const body = (fulltext.get(p.slug) || '').trim()
        return (
          `\n---\n\n# ${p.title}\n\n` +
          (p.series ? `Seri: ${p.series}\n` : '') +
          `URL: ${url}\n` +
          (p.description ? `\n${p.description}\n` : '') +
          (body ? `\n${body}\n` : '')
        )
      })
      .join('\n')
  writeFileSync(join(dist, 'llms-full.txt'), full)
} else {
  console.warn('[prerender] .fulltext-cache.json yok — llms-full.txt atlandı (önce npm run search-index)')
}

// --- feed.xml (RSS 2.0): AI okuyucular ve ajanlar için makine-okunur akış -----
function rfc822(iso) {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00Z').toUTCString()
  } catch {
    return ''
  }
}
const feed =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n' +
  `  <title>${esc(SITE_NAME)}</title>\n` +
  `  <link>${escAttr(SITE_URL + base)}</link>\n` +
  `  <description>${esc(SITE_DESCRIPTION)}</description>\n` +
  `  <language>tr</language>\n` +
  `  <atom:link href="${escAttr(SITE_URL + base + 'feed.xml')}" rel="self" type="application/rss+xml" />\n` +
  posts
    .map((p) => {
      const url = `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`
      return (
        '  <item>\n' +
        `    <title>${esc(p.title)}</title>\n` +
        `    <link>${escAttr(url)}</link>\n` +
        `    <guid isPermaLink="true">${escAttr(url)}</guid>\n` +
        (p.date ? `    <pubDate>${rfc822(p.date)}</pubDate>\n` : '') +
        (p.description ? `    <description>${esc(p.description)}</description>\n` : '') +
        '  </item>'
      )
    })
    .join('\n') +
  '\n</channel>\n</rss>\n'
writeFileSync(join(dist, 'feed.xml'), feed)

// --- hosting fallback'leri -------------------------------------------------
// Netlify: bilinmeyen rotalar SPA kabuğuna düşsün (prerender edilen dosyalar önce servis edilir)
writeFileSync(join(dist, '_redirects'), '/*    /index.html    200\n')
// GitHub Pages: bilinmeyen rota -> 404.html; içindeki BrowserRouter doğru rotayı render eder
writeFileSync(join(dist, '404.html'), template)

console.log(
  `[prerender] ${posts.length} yazı + ana sayfa statik HTML üretildi; ` +
    `sitemap.xml, robots.txt (AI botlarına açık), llms.txt, feed.xml, _redirects, 404.html yazıldı ` +
    `(SITE_URL=${SITE_URL})`,
)
