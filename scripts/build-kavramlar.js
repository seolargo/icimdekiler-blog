// Korpusun kavram haritasını çıkarır: public/kavramlar.json
//
// Ne yapar: public/texts/*.txt içindeki tüm düz metni okur, Türkçe eklerden
// arındırıp (dağarcık güdümlü gövdeleme) kavramları sayar, tek kelimelik
// kavramları ve ikili tamlamaları ("örtük bilgi", "geri besleme") ayrı ayrı
// sıralar, her kavramın en yoğun geçtiği yazıları ve birlikte geçtiği komşu
// kavramları verir.
//
// Gövdeleme yöntemi: bir ek ancak kalan gövde korpusta kendi başına yeterince
// sık geçen bir kelimeyse atılır ("sistemler" -> "sistem" ✓, "tasarım" -> "tasar" ✗).
// Birden çok aday varsa korpusta en sık geçen gövde seçilir; Türkçe ünsüz
// yumuşaması geri alınır (kaynağı -> kaynağ -> kaynak).
//
// Çalıştırma: npm run kavramlar   (build-search-index.js'ten SONRA)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const posts = JSON.parse(readFileSync(join(root, 'public', 'posts.json'), 'utf8')).filter(
  (p) => !p.tab, // gizli sekmeler (müzik/rehber) korpusa girmez
)

// --- durak kelimeler -------------------------------------------------------
// Bağlaç, zamir, yardımcı fiil ve "kavram olmayan" yüksek frekanslı gövdeler.
const STOP = new Set(
  `
  ancak fakat ama veya yada yani çünkü ayrıca dolayısıyla böylece oysa hatta
  ise iken ile için gibi kadar göre doğru üzere rağmen karşın sonra önce
  değil değildir değildi olan olarak olduğu olduğunu olduğundan olması olmak
  olmayan olmaz olur olabilir olmuş oldu olsun olma olanak
  eden edilen edilir edilebilir edilmiş etmek etme eder edilmesi ederek
  vardır yoktur bulunur gerekir gereken gerektirir sağlar verir alır taşır
  üretir gösterir yapar kalır kalan çalışan bulunan geçen artar azalır
  değişir olurken izler yapılan yapılır getirir koyar tutar görür bilir
  aynı başka diğer birçok birkaç bazı bütün hepsi hiçbir herhangi tüm
  kendi kendini kendine kendisi birbir birbirine birbirinden
  bunu bunun buna bunlar bunları şunu şunun onun ona onlar onları
  burada orada nerede nasıl neden niçin hangi kaçı kimi kimin
  daha çok azı fazla eksik yeterli yeterince oldukça son ilk sadece yalnız
  yalnızca ancak özellikle genellikle çoğu çoğunlukla bazen sıklıkla
  birinci ikinci üçüncü dördüncü beşinci ikin birin dört beşi altı yedi sekiz
  şudur şöyle böyle işte demek denir denen dendiği adlandırılan
  büyük küçük yüksek düşük uzun kısa hızlı yavaş erken geç iyi kötü güçlü zayıf
  yeni eski açık kapalı zor kolay basit önemli kritik temel genel özel
  benzer farklı farkl ortak ayrı bağımsız bağlı sabit değişken mevcut somut
  zorunlu mümkün olası gerçek doğru yanlış eksiksiz
  zaman süre an anda sıra sırasında dönem aşama başına yolu üzerinden üzerine
  üzerinde arasında arasındaki aras altında altı orta ortaya yerine karşı karş
  içinde içine dışında boyunca hale haline halinde taraf tarafından
  şey şeyi şeyler durum durumda konu konusu nokta biçim biçimde tür türü
  hal kez defa yer parça yan bir iki üç
  giriş sonuç bölüm başlık özet kaynakça ekler tablo şekil sayfa madde
  yavuz faruk ömer öfy august ocak şubat mart nisan mayıs haziran temmuz
  ağustos eylül ekim kasım aralık
  yaln davran tasar kullan ndan ıkinci arac kaynağ karşılığı katma
  mühendisliği geleneği kayd hari bask arız sonuc olmakla dır dir
  gelir gelmez gelen gelmesi kılar kılmak çıkan olup olmadığı olmadığını
  dönük gereği edici edilen veren verilen alınan yapılması olmadan
  birlik belirli ifade sayı yaklaş asıl hangisi bakımından itibaren
  university press amerika birleşik devletleri anlamına buradan
  bile olsa girer ettiği çekici labs addison wesley wiley springer prentice
  mekaniz altına ilgili yönde bakıldığında
  `
    .split(/\s+/)
    .filter(Boolean),
)

// Tek başına kavram sayılmayan, ama tamlama içinde anlamlı olan kelimeler:
// "geri" tek başına bir kavram değil, "geri bildirim" öyle.
const STOP_ALONE = new Set(
  `geri ayırt tersine hayatta geriye arka devre yarı bant zihinsel karşılık
   yaşam tedarik ters çift tek`
    .split(/\s+/)
    .filter(Boolean),
)

// --- 1. geçiş: dağarcık ----------------------------------------------------
const tokenize = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[’']/g, ' ') // "Türkiye'nin" -> "türkiye"
    .split(/[^a-zçğıöşü]+/)
    .filter(Boolean)

const vocab = new Map()
const docs = []
for (const p of posts) {
  const f = join(root, 'public', 'texts', `${p.slug}.txt`)
  if (!existsSync(f)) continue
  const toks = tokenize(readFileSync(f, 'utf8'))
  docs.push({ slug: p.slug, title: p.title, title_en: p.title_en, toks })
  for (const w of toks) vocab.set(w, (vocab.get(w) || 0) + 1)
}

// --- gövdeleme -------------------------------------------------------------
const SUFFIXES = [
  ...'lerimizden larımızdan lerimize larımıza lerinin larının lerini larını lerine larına lerinde larında lerinden larından leriyle larıyla leri ları ler lar'.split(' '),
  ...'ndan nden nın nin nun nün ında inde unda ünde ını ini unu ünü'.split(' '),
  ...'dan den tan ten nda nde da de ta te'.split(' '),
  ...'ın in un ün ım im um üm mız miz muz müz nız niz'.split(' '),
  ...'yla yle yla la le sı si su sü ya ye yı yi yu yü ı i u ü a e'.split(' '),
]
const BY_LEN = [...new Set(SUFFIXES)].sort((a, b) => b.length - a.length)
const SOFT = { ğ: 'k', c: 'ç', d: 't', b: 'p' } // ünsüz yumuşamasını geri al
const MIN_STEM = 4
const MIN_VOCAB = 4

function candidates(w) {
  const out = []
  for (const suf of BY_LEN) {
    if (!w.endsWith(suf)) continue
    const base = w.slice(0, -suf.length)
    if (base.length < MIN_STEM) continue
    const hard = SOFT[base.at(-1)] ? base.slice(0, -1) + SOFT[base.at(-1)] : null
    for (const c of hard ? [base, hard] : [base]) {
      if ((vocab.get(c) || 0) >= MIN_VOCAB) out.push(c)
    }
  }
  return out
}

const memo = new Map()
function stem(w) {
  if (memo.has(w)) return memo.get(w)
  let s = w
  for (let i = 0; i < 4; i++) {
    const cands = candidates(s)
    if (!cands.length) break
    // en sık geçen aday: "katmanın" -> katman (katma değil)
    const best = cands.sort((a, b) => vocab.get(b) - vocab.get(a))[0]
    if (best === s) break
    s = best
  }
  memo.set(w, s)
  return s
}

const isStop = (w) => STOP.has(w) || w.length < 4
// tamlamada kullanılabilir mi
const dropPhrase = (s, surface) => isStop(s) || isStop(surface) || /^\d/.test(s)
// tek başına kavram olarak listelenir mi
const drop = (s, surface) => dropPhrase(s, surface) || STOP_ALONE.has(s) || STOP_ALONE.has(surface)

// --- 2. geçiş: sayım -------------------------------------------------------
const uni = new Map() // stem -> { tf, df, docs:Map(slug->n), surf:Map, near:Map }
const bi = new Map() // "s1 s2" -> aynı yapı
const get = (m, k) => {
  let e = m.get(k)
  if (!e) m.set(k, (e = { tf: 0, df: 0, docs: new Map(), surf: new Map(), near: new Map() }))
  return e
}
const bump = (e, slug, surface) => {
  e.tf++
  e.docs.set(slug, (e.docs.get(slug) || 0) + 1)
  e.surf.set(surface, (e.surf.get(surface) || 0) + 1)
}

const WINDOW = 12 // birlikte geçme penceresi (kelime)
for (const d of docs) {
  const stems = d.toks.map(stem)
  const keep = [] // pencere için: kavram olan konumlar
  for (let i = 0; i < d.toks.length; i++) {
    const s = stems[i]
    if (dropPhrase(s, d.toks[i])) continue
    // ikili tamlama: iki kavramın yan yana gelmesi
    const prev = stems[i - 1]
    if (i > 0 && prev && !dropPhrase(prev, d.toks[i - 1]) && prev !== s) {
      bump(get(bi, `${prev} ${s}`), d.slug, `${d.toks[i - 1]} ${d.toks[i]}`)
    }
    if (drop(s, d.toks[i])) continue
    bump(get(uni, s), d.slug, d.toks[i])
    keep.push({ i, s })
  }
  // pencere içi birliktelik (yalnızca sık kavramlar için sonra süzülür)
  for (let a = 0; a < keep.length; a++) {
    const e = uni.get(keep[a].s)
    for (let b = a + 1; b < keep.length && keep[b].i - keep[a].i <= WINDOW; b++) {
      if (keep[b].s === keep[a].s) continue
      e.near.set(keep[b].s, (e.near.get(keep[b].s) || 0) + 1)
      const e2 = uni.get(keep[b].s)
      e2.near.set(keep[a].s, (e2.near.get(keep[a].s) || 0) + 1)
    }
  }
  for (const m of [uni, bi]) for (const e of m.values()) if (e.docs.has(d.slug)) e.df++
}

// --- sıralama + biçimlendirme ---------------------------------------------
const totalTokens = docs.reduce((n, d) => n + d.toks.length, 0)
const label = (e, key) => {
  // gövde kendi başına da yaygınsa gövdeyi göster ("sistem"), değilse en sık
  // yüzey biçimini ("üret" yerine "üretim", "mimar" yerine "mimari")
  const top = [...e.surf.entries()].sort((a, b) => b[1] - a[1])[0]
  const own = e.surf.get(key) || 0
  return own >= top[1] * 0.3 ? key : top[0]
}
const titleOf = new Map(docs.map((d) => [d.slug, d]))

function pack(map, { minDf, limit, withNear, surfaceLabel }) {
  const rows = [...map.entries()]
    .filter(([, e]) => e.df >= minDf)
    .sort((a, b) => b[1].tf - a[1].tf)
    .slice(0, limit)
  const kept = new Set(rows.map(([k]) => k))
  return rows.map(([k, e]) => {
    const top = [...e.docs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, n]) => [slug, n]) // başlıklar posts.json'dan çözülür
    const out = {
      k,
      label: surfaceLabel
        ? [...e.surf.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : label(e, k),
      tf: e.tf,
      df: e.df,
      top,
      variants: [...e.surf.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([w]) => w),
    }
    if (withNear) {
      // birliktelik: beklenenden ne kadar fazla birlikte geçiyor (PMI benzeri)
      out.near = [...e.near.entries()]
        .filter(([o]) => kept.has(o) && o !== k)
        .map(([o, n]) => [o, n / Math.sqrt(uni.get(o).tf * e.tf)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([o]) => o)
    }
    return out
  })
}

const concepts = pack(uni, { minDf: 8, limit: 200, withNear: true })
const phrases = pack(bi, { minDf: 6, limit: 100, withNear: false, surfaceLabel: true })

const out = {
  _not: 'scripts/build-kavramlar.js üretir — elle düzenleme.',
  docs: docs.length,
  tokens: totalTokens,
  vocab: vocab.size,
  concepts,
  phrases,
}
writeFileSync(join(root, 'public', 'kavramlar.json'), JSON.stringify(out))
const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024)
console.log(
  `[kavramlar] ${docs.length} yazı, ${totalTokens.toLocaleString('tr')} kelime, ${vocab.size.toLocaleString('tr')} farklı biçim -> ` +
    `${concepts.length} kavram + ${phrases.length} tamlama (${kb} KB)`,
)
