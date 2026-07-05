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

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const base = (process.env.BASE_PATH || '/').replace(/\/+$/, '/') // sonu '/' garanti
const SITE_URL = (process.env.SITE_URL || 'https://example.com').replace(/\/+$/, '')
const SITE_NAME = 'Ömer Faruk Yavuz'
const SITE_ROLE = 'Computer Engineer, Yıldız Technical University'
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

// --- ortak parçalar -------------------------------------------------------
function header() {
  return `<div class="site"><header class="site-header"><a href="${base}" class="brand">` +
    `<img class="brand-photo" src="${asset('profile.jpeg')}" alt="${escAttr(SITE_NAME)}" />` +
    `<span class="brand-name">${esc(SITE_NAME)}</span>` +
    `<span class="brand-role">${esc(SITE_ROLE)}</span>` +
    `</a></header><main class="site-main">`
}
const footer = () =>
  `</main><footer class="site-footer"><span>© 2026 ${esc(SITE_NAME)}</span></footer></div>`

const introHtml =
  '<section class="intro">' +
  '<p>Applying a cognitive evolution framework in software engineering — spanning similarity recognition, clustering, visual, abstraction, modular and generalized design, to evolutionary, intent-oriented, and reflective–adaptive system thinking with self-improving architectures.</p>' +
  '<p>Focused on building systems that learn, evolve, and align with human intent and needs.</p>' +
  '<p class="intro-quote">Every problem must be solved in design before it reaches engineering — clarity scales better than code.</p>' +
  '</section>'

function postListItem(p) {
  const thumb = p.thumb
    ? `<img class="post-thumb" src="${asset(p.thumb)}" alt="" loading="lazy" />`
    : ''
  const desc = p.description ? `<span class="post-desc">${esc(p.description)}</span>` : ''
  return (
    `<li class="post-item"><a href="${base}post/${encodeURIComponent(p.slug)}" class="post-link">` +
    thumb +
    `<div class="post-body"><span class="post-title">${esc(p.title)}</span>` +
    desc +
    `<time class="post-date" datetime="${escAttr(p.date)}">${esc(fmtDate(p.date))}</time>` +
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
const homeBody =
  header() +
  introHtml +
  `<ul class="post-list">${posts.map(postListItem).join('')}</ul>` +
  footer()
writeFileSync(join(dist, 'index.html'), renderPage({ head: homeHead, bodyHtml: homeBody }))

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
  const body =
    header() +
    `<article class="post">` +
    `<a href="${base}" class="back-link">← Tüm yazılar</a>` +
    `<div class="post-head"><div><h1 class="post-heading">${esc(p.title)}</h1>${lead}</div></div>` +
    `<div class="post-actions">` +
    `<a href="${escAttr(pdfUrl)}" target="_blank" rel="noreferrer" class="btn">Yeni sekmede aç</a>` +
    `<a href="${escAttr(pdfUrl)}" download class="btn">İndir</a>` +
    `</div>` +
    `<div class="pdf-frame"><iframe title="${escAttr(p.title)}" src="${escAttr(pdfUrl)}"></iframe></div>` +
    `</article>` +
    footer()
  write(`post/${p.slug}`, renderPage({ head, bodyHtml: body }))
}

// --- sitemap.xml -----------------------------------------------------------
const urls = [
  { loc: SITE_URL + base, lastmod: posts[0]?.date },
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

// --- robots.txt ------------------------------------------------------------
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}${base}sitemap.xml\n`,
)

// --- hosting fallback'leri -------------------------------------------------
// Netlify: bilinmeyen rotalar SPA kabuğuna düşsün (prerender edilen dosyalar önce servis edilir)
writeFileSync(join(dist, '_redirects'), '/*    /index.html    200\n')
// GitHub Pages: bilinmeyen rota -> 404.html; içindeki BrowserRouter doğru rotayı render eder
writeFileSync(join(dist, '404.html'), template)

console.log(
  `[prerender] ${posts.length} yazı + ana sayfa statik HTML üretildi; sitemap.xml, robots.txt, _redirects, 404.html yazıldı (SITE_URL=${SITE_URL})`,
)
