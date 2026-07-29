// Korpus Röntgeni — arşivi bütün olarak çözümleyip tek dosyalık bir HTML rapor üretir.
// Ağırlık merkezleri (terim sıklığı), benzerlik ağı (Jaccard), çekim merkezleri
// (ilgili-yazı gelen-derecesi), en yalnız yazılar, tema kapsamı ve izomorfizm adası.
//
// Çalıştırma:  npm run xray   (önce en az bir kez `npm run search-index` gerekir;
//              .fulltext-cache.json'a ihtiyaç duyar). Çıktı: docs/korpus-rontgeni.html
//
// Not: Bu rapor build/deploy hattının parçası DEĞİLDİR — elle çalıştırılır ve repoda tutulur.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const posts = JSON.parse(readFileSync(join(root, 'public', 'posts.json'), 'utf8'))
const themes = JSON.parse(readFileSync(join(root, 'public', 'themes.json'), 'utf8'))
const cachePath = join(root, '.fulltext-cache.json')
if (!existsSync(cachePath)) {
  console.error('HATA: .fulltext-cache.json yok. Önce: npm run search-index')
  process.exit(1)
}
const cache = JSON.parse(readFileSync(cachePath, 'utf8'))

const meta = new Map(posts.map((p) => [p.slug, p]))
const tab = new Set(posts.filter((p) => p.tab).map((p) => p.slug))
const docs = cache.filter((e) => !tab.has(e.slug) && (e.text || '').length > 300)
const N = docs.length
const T = (s) => meta.get(s)?.title || s
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// --- A) Ağırlık merkezleri -------------------------------------------------
const TERMS = {
  'Mekanizma (sebep zinciri)': /mekanizma/i,
  'Gerekçe / niyet': /gerekçe|rationale|niyet/i,
  'Katman (layer)': /katman/i,
  'Geri besleme / döngü': /geri besleme|feedback|döngü|\bloop\b/i,
  'Doğrulama / sınama / yanlışlanma': /doğrulama|sınanma|sınama|falsif|yanlışlan|verification|hipotez test|geçerlilik/i,
  'Görünürlük / okunaklılık': /görünürlük|görünür kıl|okunaklı|mieruka|legibilit/i,
  'Kurumsal hafıza / aktarım': /kurumsal hafıza|kuşaklar ?arası|aktarım zincir|süreklilik/i,
  Soyutlama: /soyutlama|abstraction/i,
  'İzomorfizm / disiplinler arası': /izomorf|disiplinler ?arası|aktarılabil|kavramsal transfer/i,
  Karmaşıklık: /karmaşıklık|complexit/i,
  'Örtük bilgi (tacit)': /örtük bilgi|tacit|dile dökül/i,
}
const weight = Object.entries(TERMS)
  .map(([k, rx]) => ({ k, n: docs.filter((d) => rx.test(d.text)).length }))
  .sort((a, b) => b.n - a.n)
const spineRx = /doğrulama|yanlışlan|falsif|öz[- ]denetim|revizyon|sınanma|kendini düzelt|geri besleme|karşı[- ]analiz|hesap ver/i
const spineCount = docs.filter((d) => spineRx.test(d.text)).length

// --- B) Benzerlik ağı ------------------------------------------------------
const words = (t) => {
  const s = new Set()
  for (const w of t.toLowerCase().replace(/[^a-zçğıöşü\s]/gi, ' ').split(/\s+/)) if (w.length > 6) s.add(w)
  return s
}
const sets = docs.map((d) => ({ slug: d.slug, s: words(d.text) }))
const jac = (a, b) => {
  let i = 0
  const [S, L] = a.size < b.size ? [a, b] : [b, a]
  for (const x of S) if (L.has(x)) i++
  return i / (a.size + b.size - i)
}
const nn = sets.map((d, i) => {
  const arr = sets
    .map((o, j) => (i === j ? null : { j, v: jac(d.s, o.s) }))
    .filter(Boolean)
    .sort((a, b) => b.v - a.v)
  return { slug: d.slug, maxSim: arr[0].v }
})
const loneliest = [...nn].sort((a, b) => a.maxSim - b.maxSim).slice(0, 6).map((x) => T(x.slug))

// --- C) Çekim merkezleri (ilgili-yazı gelen-derecesi) ----------------------
const indeg = new Map()
for (const p of posts) if (!p.tab) for (const r of p.related || []) indeg.set(r, (indeg.get(r) || 0) + 1)
const hubs = [...indeg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([s, n]) => ({ t: T(s), n }))
const noRelated = posts.filter((p) => !p.tab && (!p.related || p.related.length === 0)).length

// --- D) Tema kapsamı + izomorfizm adası ------------------------------------
const inTheme = new Set()
themes.themes.forEach((t) => t.slugs.forEach((s) => inTheme.add(s)))
const uncategorized = docs.filter((d) => !inTheme.has(d.slug)).length
const themeSizes = themes.themes.map((t) => ({ title: t.title, n: t.slugs.length })).sort((a, b) => b.n - a.n)
const bridges = []
for (let i = 0; i < themes.themes.length; i++)
  for (let j = i + 1; j < themes.themes.length; j++) {
    const A = new Set(themes.themes[i].slugs)
    const shared = themes.themes[j].slugs.filter((s) => A.has(s)).length
    if (shared > 0) bridges.push(`${themes.themes[i].title} ↔ ${themes.themes[j].title}`)
  }
const totalPairs = (themes.themes.length * (themes.themes.length - 1)) / 2

// --- HTML üretimi ----------------------------------------------------------
const pct = (n) => ((n / N) * 100).toFixed(0)
const maxW = weight[0].n
const barRow = (name, n, w, hot) =>
  `<div class="bar-row"><span class="bar-name${hot === 'accent' ? ' accent' : ''}">${esc(name)}</span>` +
  `<span class="bar-track"><span class="bar-fill${hot ? ' hot' : ''}" style="width:${w}%"></span></span>` +
  `<span class="bar-val"><b>${n}</b>${hot === 'accent' || w === null ? '' : ` · %${pct(n)}`}</span></div>`

const weightBars = weight
  .map((r, i) => barRow(r.k, r.n, ((r.n / maxW) * 100).toFixed(1), i < 5))
  .join('\n      ')

const themeMax = themeSizes[0].n
const grouped = themeSizes.filter((t) => t.n >= 7)
const smallThemes = themeSizes.filter((t) => t.n < 7)
const themeBars =
  grouped.map((t) => barRow(t.title, t.n, ((t.n / themeMax) * 100).toFixed(1), false)).join('\n      ') +
  (smallThemes.length
    ? '\n      ' +
      barRow(
        smallThemes.map((t) => t.title.split(/[,&]/)[0].trim().split(' ')[0]).join(' · '),
        `${smallThemes[0].n} ×${smallThemes.length}`,
        ((smallThemes[0].n / themeMax) * 100).toFixed(1),
        false,
      )
    : '') +
  '\n      ' +
  `<div class="bar-row"><span class="bar-name accent">Kategorisiz (henüz haritada yok)</span><span class="bar-track"><span class="bar-fill hot" style="width:100%"></span></span><span class="bar-val"><b>${uncategorized}</b> · %${pct(uncategorized)}</span></div>`

const rankList = (items, kind) =>
  '<ol class="rank">' +
  items
    .map(
      (it, i) =>
        `<li><span class="idx">${i + 1}</span><span class="t">${esc(kind === 'hub' ? it.t : it)}</span>` +
        (kind === 'hub' ? `<span class="v">${it.n}</span>` : '') +
        `</li>`,
    )
    .join('') +
  '</ol>'

const stamp = new Date().toISOString().slice(0, 10)

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Korpus Röntgeni — İçimdekiler</title>
<style>
  :root { --bg:#fff; --surface:#f6f7f9; --fg:#14171a; --muted:#667085; --faint:#97a0ac; --line:#e6e8ec; --accent:#1f7d8f; --accent-soft:#dcedf0; --bar:#cbd2da; --max:820px; }
  @media (prefers-color-scheme: dark){ :root{ --bg:#0f1214; --surface:#171b1f; --fg:#e9ecef; --muted:#9aa2ad; --faint:#6c7580; --line:#262b31; --accent:#52bccf; --accent-soft:#16333b; --bar:#333b44; } }
  :root[data-theme="dark"]{ --bg:#0f1214; --surface:#171b1f; --fg:#e9ecef; --muted:#9aa2ad; --faint:#6c7580; --line:#262b31; --accent:#52bccf; --accent-soft:#16333b; --bar:#333b44; }
  :root[data-theme="light"]{ --bg:#fff; --surface:#f6f7f9; --fg:#14171a; --muted:#667085; --faint:#97a0ac; --line:#e6e8ec; --accent:#1f7d8f; --accent-soft:#dcedf0; --bar:#cbd2da; }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--bg); color:var(--fg); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; line-height:1.6; -webkit-font-smoothing:antialiased; font-variant-numeric:tabular-nums; }
  .wrap{ max-width:var(--max); margin:0 auto; padding:0 22px; }
  section{ padding:40px 0; border-top:1px solid var(--line); }
  .eyebrow{ font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.14em; color:var(--accent); margin:0 0 14px; }
  h1{ font-size:clamp(2rem,6vw,3.1rem); font-weight:800; letter-spacing:-.03em; line-height:1.05; margin:0 0 16px; text-wrap:balance; }
  h2{ font-size:1.4rem; font-weight:700; letter-spacing:-.02em; margin:0 0 6px; text-wrap:balance; }
  h3{ font-size:.95rem; font-weight:700; margin:0 0 10px; letter-spacing:-.01em; }
  p{ margin:0 0 14px; max-width:64ch; }
  .lead{ font-size:1.12rem; } .muted{ color:var(--muted); } .accent{ color:var(--accent); }
  .sec-intro{ color:var(--muted); margin-bottom:26px; max-width:64ch; }
  header.hero{ padding:64px 0 8px; }
  .hero-meta{ color:var(--faint); font-size:.85rem; margin-top:20px; }
  .stats{ display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-top:30px; }
  .tile{ background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:16px 14px; }
  .tile .num{ font-size:1.9rem; font-weight:800; letter-spacing:-.03em; line-height:1; }
  .tile .lbl{ font-size:.76rem; color:var(--muted); margin-top:8px; line-height:1.3; }
  .tile.key .num{ color:var(--accent); }
  .bars{ display:flex; flex-direction:column; gap:9px; }
  .bar-row{ display:grid; grid-template-columns:210px 1fr auto; align-items:center; gap:14px; }
  .bar-name{ font-size:.9rem; }
  .bar-track{ position:relative; height:12px; }
  .bar-fill{ position:absolute; inset:0 auto 0 0; height:100%; background:var(--bar); border-radius:3px; }
  .bar-fill.hot{ background:var(--accent); }
  .bar-val{ font-size:.85rem; color:var(--muted); min-width:62px; text-align:right; }
  .bar-val b{ color:var(--fg); font-weight:700; }
  .callout{ background:var(--accent-soft); border:1px solid var(--line); border-left:3px solid var(--accent); border-radius:12px; padding:22px 24px; margin:8px 0 22px; }
  .callout .q{ font-size:1.32rem; font-weight:700; letter-spacing:-.02em; line-height:1.3; margin:0 0 10px; text-wrap:balance; }
  .callout p{ margin:0; }
  .cols{ display:grid; grid-template-columns:1fr 1fr; gap:28px; }
  .card{ background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:20px; }
  .card .tag{ display:inline-block; font-size:.72rem; color:var(--muted); border:1px solid var(--line); border-radius:999px; padding:1px 8px; margin-left:6px; }
  ol.rank{ list-style:none; margin:0; padding:0; }
  ol.rank li{ display:flex; gap:12px; padding:9px 0; border-top:1px solid var(--line); font-size:.92rem; align-items:baseline; }
  ol.rank li:first-child{ border-top:none; }
  ol.rank .idx{ color:var(--faint); font-size:.8rem; min-width:16px; }
  ol.rank .t{ flex:1; } ol.rank .v{ color:var(--accent); font-weight:700; font-size:.82rem; }
  .chip-row{ display:flex; flex-wrap:wrap; gap:8px; }
  .chip{ font-size:.82rem; border:1px solid var(--line); background:var(--surface); border-radius:999px; padding:4px 12px; color:var(--muted); }
  ol.moves{ counter-reset:m; list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:16px; }
  ol.moves li{ counter-increment:m; display:grid; grid-template-columns:34px 1fr; gap:14px; }
  ol.moves li::before{ content:counter(m); font-size:.85rem; font-weight:700; color:var(--accent); border:1px solid var(--line); border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; background:var(--surface); }
  ol.moves h3{ margin:3px 0 4px; } ol.moves p{ margin:0; color:var(--muted); font-size:.92rem; }
  footer{ padding:34px 0 60px; color:var(--faint); font-size:.8rem; }
  footer p{ max-width:68ch; margin:0 0 8px; }
  @media (max-width:620px){ .stats{ grid-template-columns:repeat(2,1fr); } .bar-row{ grid-template-columns:130px 1fr auto; gap:9px; } .bar-name{ font-size:.82rem; } .cols{ grid-template-columns:1fr; gap:16px; } }
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <p class="eyebrow">Korpus Röntgeni</p>
    <h1>${N} yazıyı tek tek değil, bir gövde olarak okumak.</h1>
    <p class="lead">Bu, İçimdekiler arşivinin kendisine sorulmuş birkaç sorudur. Hiçbir tek yazının cevaplayamayacağı türden: ağırlık merkezlerin neler, hangi soruya yakınsıyorsun, hangi metin yalnız kalmış, bağ dokusu nerede eksik.</p>
    <p class="hero-meta">${N} açık yazı · hesaplamalı çözümleme · ${stamp}</p>
    <div class="stats">
      <div class="tile"><div class="num">${N}</div><div class="lbl">açık yazı (gövde)</div></div>
      <div class="tile key"><div class="num">${spineCount}</div><div class="lbl">doğrulama / öz-denetim fikrine değen yazı</div></div>
      <div class="tile"><div class="num">${noRelated}</div><div class="lbl">hiçbir yazıya bağlanmamış</div></div>
      <div class="tile"><div class="num">${uncategorized}</div><div class="lbl">henüz bir temaya girmemiş</div></div>
      <div class="tile"><div class="num">${themes.themes.length}</div><div class="lbl">tema (${N - uncategorized} yazıyı kapsıyor)</div></div>
    </div>
  </header>

  <section>
    <p class="eyebrow">1 · Düşünce parmak izi</p>
    <h2>İskelet: ${weight.slice(0, 5).map((w) => w.k.split(' ')[0].toLowerCase()).join(', ')}.</h2>
    <p class="sec-intro">Her imza kavramın kaç yazıda göründüğü. İlk beşi (vurgulu) korpusun taşıyıcı aygıtı — yazıların çoğu, konusu ne olursa olsun bu kavramlarla düşünüyor. Bir zaaf değil imza; ama “bir süre sonra her şey yapısal bir örüntüye benzeyebilir” notu artık tahmin değil, sayı.</p>
    <div class="bars">
      ${weightBars}
    </div>
  </section>

  <section>
    <p class="eyebrow">2 · Yakınsama</p>
    <h2>Arşiv tek bir soruya doğru dönüyor.</h2>
    <p class="sec-intro">Doğrulama, sınama, öz-denetim, revizyon, hesap verme — bu aile korpusun neredeyse yarısına (${spineCount} yazı) değiyor. En yeni ve metinsel olarak en merkezî yazılar tam da burada toplanıyor.</p>
    <div class="callout">
      <p class="q">Bir zihin, bir kurum ya da bir alan — yanıldığını nasıl öğrenir, ve bunun bedeli nedir?</p>
      <p>Kurumsal Mükemmellik, Uzun Döngülü Karar Problemleri, Sekizinci Soru, Duvarlarla İlerlemek, Bilginin Halka Ulaşması, Gerekçenin Taşınması, Anlamın Sınırları. Farklı ölçekler, tek problem. Henüz tek bir metinde adı konmamış olan da bu.</p>
    </div>
  </section>

  <section>
    <p class="eyebrow">3 · İroni</p>
    <h2>Alanları bağlayan tema, kendisi en yalnız ada.</h2>
    <p class="sec-intro">Sekiz temanın kesişim grafiğinde birbirine değen tek ${bridges.length} tema-çifti var; kalan ${totalPairs - bridges.length}’i hiç örtüşmüyor. “Disiplinler arası izomorfizm” — her şeyi bağlaması gereken imza tema — diğerleriyle tek yazı paylaşmıyor. Metotların en bağlayıcısı, yapısal olarak en kopuk yerde.</p>
    <div class="chip-row">
      ${bridges.map((b) => `<span class="chip">${esc(b)}</span>`).join('\n      ') || '<span class="chip muted">hiç köprü yok</span>'}
    </div>
    <p class="muted" style="margin-top:16px">Bunun bir kısmı yöntemden: harita şu an bir <em>bölümleme</em> (her yazı tek temada). Ama asıl mesaj şu — <strong>bağ dokusu zayıf çünkü henüz örülmedi.</strong></p>
  </section>

  <section>
    <p class="eyebrow">4 · Bağ dokusu</p>
    <h2>Merkez ve kenar.</h2>
    <p class="sec-intro">Solda çekim merkezleri — en çok yazıya referans olan göbek metinler. Sağda kenardakiler — metinsel olarak hiçbir şeye benzemeyen, en yalnız yazılar. Kenar, ya korpusun sınırı ya da budanacak fazlalık.</p>
    <div class="cols">
      <div class="card"><h3>Çekim merkezleri <span class="tag">en çok bağlanan</span></h3>${rankList(hubs, 'hub')}</div>
      <div class="card"><h3>Kenardakiler <span class="tag">en yalnız</span></h3>${rankList(loneliest, 'lonely')}</div>
    </div>
  </section>

  <section>
    <p class="eyebrow">5 · Kapsam</p>
    <h2>Harita, gövdenin bir kısmını örtüyor.</h2>
    <p class="sec-intro">Temaların büyüklükleri birbirine yakın. Ama kategorisiz kalan ${uncategorized} yazı, hepsinin toplamından büyük. Bir eksik değil, açık bir cephe: yazılmış ama henüz düzenlenmemiş malzeme.</p>
    <div class="bars">
      ${themeBars}
    </div>
  </section>

  <section>
    <p class="eyebrow">6 · Bu ne açıyor</p>
    <h2>İkinci mertebe iş — tek satır yeni paper gerektirmeden.</h2>
    <p class="sec-intro">Hepsi eldeki ${N} metinle yapılabilir. “Yazacak bir şey kalmadı” hissinin karşılığı burada: birinci mertebe üretim doymuş olabilir; bu damar henüz açılmadı.</p>
    <ol class="moves">
      <li><div><h3>Doğrulama omurgasını tek metinde adlandır</h3><p>Yarım korpusa yayılmış “yanıldığını nasıl öğrenirsin” sorusunu bir çatı yazıda topla — muhtemelen korpusun asıl kitabı bu.</p></div></li>
      <li><div><h3>Çelişki taraması</h3><p>Aynı şeye zıt hüküm veren yazı çiftlerini çıkar. Çözülmemiş gerilimler en verimli yeni yazı konularıdır.</p></div></li>
      <li><div><h3>İzomorfizm adasını köprüle</h3><p>İmza temanı diğer temalarla kesiştir: aynı yapının farklı temalardaki yazılarda nasıl döndüğünü göster.</p></div></li>
      <li><div><h3>Kenarı karara bağla</h3><p>En yalnız yazılar için tek tek: sınır mı (geliştir), fazlalık mı (bırak).</p></div></li>
      <li><div><h3>Bağ dokusunu ör</h3><p>${noRelated} bağlantısız, ${uncategorized} kategorisiz yazıya çapraz referans ve tema ver. Arşiv o zaman yığın olmaktan çıkıp gerçekten korpus olur.</p></div></li>
    </ol>
  </section>

  <footer>
    <p><strong>Yöntem.</strong> Ağırlık merkezleri tam metinde terim kalıplarının (regex) taranmasıyla; benzerlik yazılar arası ortak-kelime (Jaccard) örtüşmesiyle; çekim merkezleri elle kurulmuş “ilgili yazı” bağlarının gelen-derecesiyle hesaplandı. Sayılar yaklaşık ve yöntem-bağımlıdır; amaç kesin ölçüm değil, gövdenin biçimini görünür kılmaktır. <code>npm run xray</code> ile yeniden üretilir.</p>
    <p>İçimdekiler · Ömer Faruk Yavuz · korpus röntgeni · ${stamp}</p>
  </footer>
</div>
</body>
</html>
`

const outDir = join(root, 'docs')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'korpus-rontgeni.html'), html)
console.log(`[xray] docs/korpus-rontgeni.html yazıldı — ${N} yazı, ${spineCount} omurga, ${uncategorized} kategorisiz`)
