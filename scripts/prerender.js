// vite build sonrası çalışır: her rota için gerçek statik HTML üretir.
// - <head>: title, description, canonical, Open Graph, Twitter, JSON-LD
// - #root: JS olmadan da görünen gerçek içerik (crawler + no-JS için)
// - sitemap.xml, robots.txt ve hosting fallback'leri (_redirects, 404.html)
//
// Yapılandırma (ortam değişkenleri):
//   SITE_URL   -> yayınlanacak tam adres, ör. https://ornek.com  (canonical/sitemap için)
//   BASE_PATH  -> alt dizinde barındırma yolu, ör. /repo/ (vite.config.js ile aynı)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { excerpt, RELATED_WORDS } from '../src/excerpt.js'

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
    tab(base + 'rehberler', 'Rehberler', 'rehber') +
    tab(base + 'muzik', 'Müzik', 'muzik') +
    tab(base + 'oneriler', 'Öneriler', 'oneriler') +
    tab(base + 'projeler', 'Projeler', 'projeler') +
    tab(base + 'duvarlar', 'Duvarlar', 'duvarlar') +
    tab(base + 'yapay-zeka', 'Yapay Zekâ', 'yapay-zeka') +
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

// İletişim bağlantıları (src/App.jsx'teki CONTACTS ile eşitle)
const CONTACTS = [
  { label: 'E-posta', url: 'mailto:mail.omerfaruk@gmail.com' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ömer-faruk-y-15343a147/' },
  { label: 'GitHub', url: 'https://github.com/seolargo' },
  { label: 'X', url: '' },
  { label: 'Medium', url: '' },
].filter((c) => c.url)
const footer = () => {
  const links = CONTACTS.map(
    (c) =>
      `<a href="${escAttr(c.url)}"${c.url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(c.label)}</a>`,
  ).join('')
  const contact = CONTACTS.length
    ? `<div class="footer-contact"><span class="footer-label">İletişim</span>${links}</div>`
    : ''
  return (
    `</main><footer class="site-footer">${contact}<div class="footer-meta">` +
    `<span>© ${new Date().getFullYear()} ${esc(SITE_NAME)}</span>` +
    `<span class="footer-updated">Son güncelleme: ${esc(lastChangeText)}</span></div></footer></div>`
  )
}

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
  const meta = [p.belge, p.series, p.pages > 0 ? `${p.pages} sayfa` : null].filter(Boolean).join(' · ')
  const prio = p.priority
    ? `<span class="post-priority p${p.priority}">${p.priority}</span>`
    : ''
  const ser = meta || prio ? `<span class="post-series">${prio}${esc(meta)}</span>` : ''
  const desc = p.description ? `<span class="post-desc">${esc(excerpt(p.description))}</span>` : ''
  return (
    `<li class="post-item"><a href="${base}post/${encodeURIComponent(p.slug)}" class="post-link">` +
    thumb +
    `<div class="post-body"><span class="post-title">${esc(p.title)}</span>` +
    ser +
    desc +
    `</div></a></li>`
  )
}

// Gizli (müzik/rehber) paperlar: yalnızca başlık — tıklanamaz, önizleme yok.
function hiddenListItem(p) {
  return `<li class="post-item hidden-item"><span class="post-title">${esc(p.title)}</span></li>`
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
const writings = posts.filter((p) => !p.tab) // sekmeli yazılar (müzik, rehber) hariç
const musicPosts = posts.filter((p) => p.tab === 'muzik')
const guidePosts = posts.filter((p) => p.tab === 'rehber')
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
  `<ul class="post-list">${musicPosts.map(hiddenListItem).join('')}</ul>` +
  footer()
write('muzik', renderPage({ head: muzikHead, bodyHtml: muzikBody }))

// --- REHBERLER SEKMESİ -------------------------------------------------------
const rehberHead = buildHead({
  title: 'Rehberler',
  description: 'Kapsamlı başvuru rehberleri ve ders notları.',
  canonical: `${SITE_URL}${base}rehberler`,
  type: 'website',
  image: '/profile.jpeg',
})
const rehberBody =
  header('rehber') +
  `<ul class="post-list">${guidePosts.map(hiddenListItem).join('')}</ul>` +
  footer()
write('rehberler', renderPage({ head: rehberHead, bodyHtml: rehberBody }))

// --- ÖNERİLER SEKMESİ --------------------------------------------------------
const recs = existsSync(join(dist, 'recommendations.json'))
  ? JSON.parse(readFileSync(join(dist, 'recommendations.json'), 'utf8'))
  : []
const recHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
const recItem = (it) =>
  `<li class="rec-item"><a class="rec-link" href="${escAttr(it.url)}" target="_blank" rel="noopener noreferrer">` +
  `<span class="rec-name">${esc(it.name)}</span>` +
  (it.url ? `<span class="rec-host">${esc(recHost(it.url))} ↗</span>` : '') +
  `</a>${it.note ? `<p class="rec-note">${esc(it.note)}</p>` : ''}</li>`
const recHead = buildHead({
  title: 'Öneriler',
  description: 'Okuduğum ve işime yarayan kaynaklar — isimler, siteler, belgeler.',
  canonical: `${SITE_URL}${base}oneriler`,
  type: 'website',
  image: '/profile.jpeg',
})
const recBody =
  header('oneriler') +
  `<p class="rec-intro muted">Okuduğum ve işime yarayan kaynaklar — isimler, siteler, belgeler.</p>` +
  (recs.length
    ? `<ul class="rec-list">${recs.map(recItem).join('')}</ul>`
    : `<p class="muted rec-empty">Yakında — önerilen isimler ve siteleri burada paylaşılacak.</p>`) +
  footer()
write('oneriler', renderPage({ head: recHead, bodyHtml: recBody }))


// --- PROJELER SEKMESİ --------------------------------------------------------
const projects = existsSync(join(dist, 'projects.json'))
  ? JSON.parse(readFileSync(join(dist, 'projects.json'), 'utf8'))
  : []
const projItem = (it) =>
  `<li class="proj-item">` +
  // deposu olmayan proje (ör. özel repo) linksiz görünür
  (it.url
    ? `<a class="proj-link" href="${escAttr(it.url)}" target="_blank" rel="noopener noreferrer">`
    : `<span class="proj-link">`) +
  `<span class="proj-name">${esc(it.title || it.name)}</span>` +
  (it.lang ? `<span class="proj-lang">${esc(it.lang)}</span>` : '') +
  (it.url ? `</a>` : `</span>`) +
  `${it.desc ? `<p class="proj-desc">${esc(it.desc)}</p>` : ''}` +
  (it.homepage
    ? `<a class="proj-live" href="${escAttr(it.homepage)}" target="_blank" rel="noopener noreferrer">Canlı ↗</a>`
    : '') +
  `</li>`
const projHead = buildHead({
  title: 'Projeler',
  description: 'Geliştirdiğim projeler.',
  canonical: `${SITE_URL}${base}projeler`,
  type: 'website',
  image: '/profile.jpeg',
})
const projBody =
  header('projeler') +
  `<p class="rec-intro muted">GitHub’daki açık kaynak projelerim.</p>` +
  (projects.length
    ? `<ul class="proj-list">${projects.map(projItem).join('')}</ul>`
    : '') +
  footer()
write('projeler', renderPage({ head: projHead, bodyHtml: projBody }))

// --- DUVARLAR (korpus kural kataloğu) --------------------------------------
const duvarlar = existsSync(join(dist, 'duvarlar.json'))
  ? JSON.parse(readFileSync(join(dist, 'duvarlar.json'), 'utf8'))
  : { themes: {}, walls: [] }
const dvIntro =
  'Arşivdeki makalelerden süzülmüş taşınabilir kurallar. Her kural bir duvar: nerede geçerli, ' +
  'nerede kırıldığı ve neyi engellediği yazılıdır. Bir sorunla karşılaştığında “bu duvara daha ' +
  'önce çarpılmış mı, nedeni neydi” diye sor.'
const dvThemeName = (k) => duvarlar.themes?.[k]?.name || k
const dvCard = (w) =>
  `<li class="dv-card" data-theme="${escAttr(w.t)}">` +
  `<div class="dv-head"><span class="dv-id" data-theme="${escAttr(w.t)}">${esc(w.id)}</span>` +
  `<span class="dv-tag"><span class="dv-dot" data-theme="${escAttr(w.t)}"></span>${esc(dvThemeName(w.t))}</span></div>` +
  `<h2 class="dv-title">${esc(w.title)}</h2>` +
  `<div class="dv-fields">` +
  `<div class="dv-field"><span class="dv-lbl">Kural</span><p>${esc(w.kural)}</p></div>` +
  `<div class="dv-field dv-breaks"><span class="dv-lbl">Kırılır</span><p>${esc(w.kirilir)}</p></div>` +
  `<div class="dv-field dv-reason"><span class="dv-lbl">Neden</span><p>${esc(w.neden)}</p></div>` +
  `<div class="dv-sources">${(w.kaynak || []).map((k) => `<span class="dv-src">${esc(k)}</span>`).join('')}</div>` +
  `</div></li>`
const dvHead = buildHead({
  title: 'Duvarlar',
  description:
    'Korpustan türetilmiş taşınabilir kurallar: her kural nerede geçerli, nerede kırılır ve neyi engeller.',
  canonical: `${SITE_URL}${base}duvarlar`,
  type: 'website',
  image: '/profile.jpeg',
})
const dvBody =
  header('duvarlar') +
  `<div class="dv"><p class="dv-intro">${esc(dvIntro)}</p>` +
  `<ul class="dv-list">${(duvarlar.walls || []).map(dvCard).join('')}</ul></div>` +
  footer()
write('duvarlar', renderPage({ head: dvHead, bodyHtml: dvBody }))

// --- YAPAY ZEKÂ SEKMESİ ------------------------------------------------------
// Seçki public/ai.json'dan gelir; bu sekme açık yazıları gruplayan bir görünüm,
// `tab` alanı kullanılmaz (o alan "dışa kapalı" demek). Yazılar Yazılar
// sekmesinde de durmaya devam eder.
const aiPath = join(dist, 'ai.json')
const ai = existsSync(aiPath)
  ? JSON.parse(readFileSync(aiPath, 'utf8'))
  : { intro: '', groups: [] }
const bySlugAll = new Map(posts.map((p) => [p.slug, p]))
const aiGroups = (ai.groups || [])
  .map((g) => ({ ...g, items: g.slugs.map((s) => bySlugAll.get(s)).filter(Boolean) }))
  .filter((g) => g.items.length)
const aiMissing = (ai.groups || []).flatMap((g) => g.slugs).filter((s) => !bySlugAll.has(s))
if (aiMissing.length) console.warn(`[prerender] ai.json'da karşılığı olmayan slug: ${aiMissing.join(', ')}`)
const aiHead = buildHead({
  title: 'Yapay Zekâ',
  description: ai.intro || 'Yapay Zekâ bölümü.',
  canonical: `${SITE_URL}${base}yapay-zeka`,
  type: 'website',
  image: '/profile.jpeg',
})
const aiBody =
  header('yapay-zeka') +
  (ai.intro ? `<p class="rec-intro muted">${esc(ai.intro)}</p>` : '') +
  (aiGroups.length
    ? aiGroups
        .map(
          (g) =>
            `<section class="ai-group"><h2 class="section-head">${esc(g.title)}</h2>` +
            `<p class="muted ai-blurb">${esc(g.blurb || '')}</p>` +
            `<ul class="post-list">${g.items.map(postListItem).join('')}</ul></section>`,
        )
        .join('')
    : `<p class="muted rec-empty">Yakında.</p>`) +
  footer()
write('yapay-zeka', renderPage({ head: aiHead, bodyHtml: aiBody }))

// --- YAZI SAYFALARI --------------------------------------------------------
const postsBySlug = new Map(posts.map((p) => [p.slug, p]))
for (const p of posts) {
  if (p.tab) continue // müzik/rehber paperlarının yazı sayfası dışa üretilmez
  const canonical = `${SITE_URL}${base}post/${encodeURIComponent(p.slug)}`
  const pdfUrl = asset(`pdfs/${p.pdf}`)
  const textUrl = asset(`texts/${p.slug}.txt`)
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
  const metaLine = [p.series, p.pages > 0 ? `${p.pages} sayfa` : null].filter(Boolean).join(' · ')
  const meta = metaLine ? `<p class="post-meta">${esc(metaLine)}</p>` : ''
  const lead = p.description ? `<p class="post-lead">${esc(p.description)}</p>` : ''
  const isMusic = p.tab === 'muzik'
  const isGuide = p.tab === 'rehber'
  const backHref = isMusic ? base + 'muzik' : isGuide ? base + 'rehberler' : base
  const backLabel = isMusic ? '← Müzik' : isGuide ? '← Rehberler' : '← Tüm yazılar'
  const curatedRelated = (p.related || []).map((s) => postsBySlug.get(s)).filter((r) => r && !r.tab)
  const relatedPosts = curatedRelated.length
    ? curatedRelated
    : p.series
      ? posts.filter((o) => o.series === p.series && o.slug !== p.slug).slice(0, 8)
      : []
  const related = relatedPosts.length
    ? `<div class="post-related"><h2 class="post-related-title">İlgili Yazılar</h2>` +
      `<ul class="post-related-list">${relatedPosts
        .map((rp) => {
          const thumb = rp.thumb
            ? `<img class="post-related-thumb" src="${asset(rp.thumb)}" alt="" loading="lazy" />`
            : ''
          const desc = rp.description
            ? `<span class="post-related-desc">${esc(excerpt(rp.description, RELATED_WORDS))}</span>`
            : ''
          return (
            `<li class="post-related-item"><a href="${base}post/${encodeURIComponent(rp.slug)}">` +
            thumb +
            `<span class="post-related-body"><span class="post-related-name">${esc(rp.title)}</span>` +
            desc +
            `</span></a></li>`
          )
        })
        .join('')}</ul></div>`
    : ''
  const citeYear = (p.date || '').slice(0, 4) || String(new Date().getFullYear())
  const nameParts = SITE_NAME.split(' ')
  const ieeeAuthor = `${nameParts.slice(0, -1).map((w) => w[0] + '.').join(' ')} ${nameParts.at(-1)}`
  const readableUrl = `${SITE_URL}${base}post/${p.slug}`
  const citeText = `[1] ${ieeeAuthor}, "${p.title}," İçimdekiler, ${citeYear}. [Çevrimiçi]. Erişim: ${readableUrl}`
  const cite =
    `<section class="cite"><h2 class="cite-title">Bu yazıya şöyle atıf yapabilirsin</h2>` +
    `<p class="cite-text">${esc(citeText)}</p>` +
    `<div class="cite-actions"><button type="button" class="btn">Atfı kopyala</button>` +
    `<button type="button" class="btn">BibTeX</button></div></section>`
  const body =
    header(isMusic ? 'muzik' : isGuide ? 'rehber' : 'yazilar') +
    `<article class="post">` +
    `<a href="${escAttr(backHref)}" class="back-link">${backLabel}</a>` +
    `<div class="post-head"><div><h1 class="post-heading">${esc(p.title)}</h1>${meta}${lead}</div></div>` +
    (p.note ? `<p class="post-note">${esc(p.note)}</p>` : '') +
    `<div class="post-actions">` +
    `<a href="${escAttr(pdfUrl)}" target="_blank" rel="noreferrer" class="btn">Yeni sekmede aç</a>` +
    `<a href="${escAttr(pdfUrl)}" download class="btn">PDF indir</a>` +
    `<button type="button" class="btn">Metni Kopyala</button>` +
    `<a href="${escAttr(textUrl)}" download="${escAttr(p.slug)}.txt" class="btn">Metni İndir</a>` +
    `<button type="button" class="btn">Paylaş</button>` +
    `</div>` +
    `<div class="pdf-frame"><iframe title="${escAttr(p.title)}" src="${escAttr(pdfUrl)}"></iframe></div>` +
    related +
    cite +
    `</article>` +
    footer()
  write(`post/${p.slug}`, renderPage({ head, bodyHtml: body }))
}

// --- sitemap.xml -----------------------------------------------------------
const urls = [
  { loc: SITE_URL + base, lastmod: posts[0]?.date },
  { loc: `${SITE_URL}${base}muzik` },
  { loc: `${SITE_URL}${base}rehberler` },
  { loc: `${SITE_URL}${base}oneriler` },
  { loc: `${SITE_URL}${base}projeler` },
  { loc: `${SITE_URL}${base}duvarlar` },
  { loc: `${SITE_URL}${base}yapay-zeka` },
  ...writings.map((p) => ({
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
    for (const p of writings) {
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
    writings
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

// --- GİZLİ PAPERLAR: dağıtımdan (dist) erişimi kapat --------------------------
// Müzik/rehber sekmesindeki paperlar şimdilik dışa kapalı: yazı sayfası zaten
// üretilmedi; burada PDF, önizleme ve metin dosyalarını dist'ten siler,
// posts.json ve search-index.json'daki kayıtlarını da kısıtlar. (Kaynak
// public/ dosyaları değişmez; yalnızca yayınlanan kopya kısıtlanır.)
const hidden = posts.filter((p) => p.tab)
const rm = (rel) => {
  const f = join(dist, rel)
  if (existsSync(f)) rmSync(f)
}
for (const p of hidden) {
  if (p.pdf) rm(`pdfs/${p.pdf}`)
  if (p.thumb) rm(p.thumb)
  rm(`texts/${p.slug}.txt`)
}
// dist/posts.json: gizli paperlar yalnızca başlık olarak kalsın (pdf/açıklama/thumb dışa sızmasın)
const distPosts = posts.map((p) =>
  p.tab ? { slug: p.slug, title: p.title, tab: p.tab } : p,
)
writeFileSync(join(dist, 'posts.json'), JSON.stringify(distPosts))
// dist/search-index.json: gizli paperların tam metnini indeksten çıkar
const idxPath = join(dist, 'search-index.json')
if (existsSync(idxPath)) {
  const hiddenSlugs = new Set(hidden.map((p) => p.slug))
  const idx = JSON.parse(readFileSync(idxPath, 'utf8')).filter((e) => !hiddenSlugs.has(e.slug))
  writeFileSync(idxPath, JSON.stringify(idx))
}

console.log(
  `[prerender] ${writings.length} açık + ${hidden.length} gizli yazı işlendi; ana sayfa statik HTML üretildi; ` +
    `sitemap.xml, robots.txt (AI botlarına açık), llms.txt, feed.xml, _redirects, 404.html yazıldı ` +
    `(SITE_URL=${SITE_URL})`,
)
