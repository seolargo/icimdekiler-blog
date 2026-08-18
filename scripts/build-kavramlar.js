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
  mekaniz altına ilgili yönde bakıldığında üzerindeki döner taşımaz ilerler
  press university journal review science theory society learning knowledge
  management systems software business innovation product safety experience
  design street quarterly page spec secure think trust accountability driven
  obsession engineering practice research study analysis chapter edition
  organization behavior performance technology american harvard oxford
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
// Türkçede 'ı' ile başlayan kelime sayılıdır; PDF çıkarımında 'İ' -> 'I' -> 'ı'
// düştüğü için baştaki 'ı' bu istisnalar dışında 'i'ye çevrilir (ıtiraz -> itiraz).
const I_WORDS = /^(ısı|ışık|ılık|ıslak|ırk|ısrar|ızgara|ıskarta|ıtır|ırmak|ısır|ıslah)/
const fixI = (w) => (w[0] === 'ı' && !I_WORDS.test(w) ? `i${w.slice(1)}` : w)
const tokenize = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[’']/g, ' ') // "Türkiye'nin" -> "türkiye"
    .split(/[^a-zçğıöşü]+/)
    .filter(Boolean)
    .map(fixI)

const vocab = new Map()
const docs = []
for (const p of posts) {
  const f = join(root, 'public', 'texts', `${p.slug}.txt`)
  if (!existsSync(f)) continue
  const txt = readFileSync(f, 'utf8')
  const toks = tokenize(txt)
  // özel adlar için: aynı bölmeyle harf durumu korunmuş diziliş + cümle başları.
  // Kaynakça bölümü kesilir — yoksa liste İngilizce kitap adlarıyla dolar.
  const cut = txt.search(/\n\s*(Kaynak(ça|lar)|References|Bibliography)\s*\n/i)
  const body = cut > 0 ? txt.slice(0, cut) : txt
  const cased = body.replace(/[’']/g, ' ').split(/[^A-Za-zÇĞİÖŞÜçğıöşü]+/).filter(Boolean)
  const starts = new Set()
  let ci = 0
  const re = /([.!?:;”"»)\]]\s*|\n\s*)?([A-Za-zÇĞİÖŞÜçğıöşü]+)/g
  let m
  while ((m = re.exec(body))) {
    if (m[1]) starts.add(ci)
    ci++
  }
  docs.push({ slug: p.slug, title: p.title, title_en: p.title_en, toks, cased, starts })
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

// --- tamlama süzgeci: dilbilgisel kırıntıları at ---------------------------
// "hata oranı" bir terimdir (iyelik eki tamlamayı kurar); "üretim ortamında"
// ya da "bilgi akışının" ise cümlenin ortasından kesilmiş bir parçadır.
const POSSESSIVE = new Set(['', 'ı', 'i', 'u', 'ü', 'sı', 'si', 'su', 'sü', 'ları', 'leri'])
const HEAD_OK = new Set(['', 'lar', 'ler'])
const GENITIVE = new Set(['ın', 'in', 'un', 'ün', 'nın', 'nin', 'nun', 'nün', 'ların', 'lerin'])
const suffixOf = (surface, stem) => {
  if (surface.startsWith(stem)) return surface.slice(stem.length)
  let i = 0
  while (i < stem.length && surface[i] === stem[i]) i++
  if (i >= stem.length - 1 && surface.length > i) return surface.slice(i + 1) // ünsüz yumuşaması
  return null
}
function isTerm(surfacePair, stemPair) {
  const [w1, w2] = surfacePair.split(' ')
  const [s1, s2] = stemPair.split(' ')
  const a = suffixOf(w1, s1)
  const b = suffixOf(w2, s2)
  if (a === null || b === null) return false
  if (!POSSESSIVE.has(b) && !HEAD_OK.has(b)) return false // "…ortamında", "…akışının"
  if (HEAD_OK.has(a)) return true
  // tamlayan eki ancak tamlanan iyelik alıyorsa geçerli: "kararların gerekçesi"
  return GENITIVE.has(a) && POSSESSIVE.has(b) && b !== ''
}

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

function pack(map, { minDf, minTf = 0, limit, withNear, surfaceLabel, score, keep }) {
  const scoreOf = score || ((e) => e.tf)
  const rows = [...map.entries()]
    .filter(([k, e]) => e.df >= minDf && e.tf >= minTf && (!keep || keep(k, e)))
    .sort((a, b) => scoreOf(b[1]) - scoreOf(a[1]))
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
      s: Math.round(scoreOf(e) * 10) / 10, // bulutta boyutlandırma için
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

// --- özel adlar -------------------------------------------------------------
// Cümle başı olmayan konumda büyük harfle başlayan, korpusta küçük harfle
// nadiren geçen kelimeler: kişi, kurum, yer, model adları.
const CAPRE = /^[A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü]{2,}$/
const MONTHS = new Set(
  `ocak şubat mart nisan mayıs haziran temmuz ağustos eylül ekim kasım aralık
   january february march april may june july august september october november december`.split(
    /\s+/,
  ),
)
const SELF = new Set(['ömer', 'faruk', 'yavuz', 'öfy'])
// metin içi İngilizce eser adlarından sızanlar (kaynakça kesildikten sonra kalanlar)
const EN_TITLE = new Set(
  `system economic winter human work world dimension mind lead language strategy
   psychology know brain how done building studies decision complexity project
   structure royal hall information intelligence ontology what why when where
   making thinking being first new great modern general special applied advanced
   art science craft theory practice method model models data code
   institution definition owner`.split(/\s+/),
)
const dotI = (w) => w.replace(/^I(?=[a-zçğıöşü])/, 'İ') // PDF'te düşen İ noktasını geri koy
const norm = (w) => fixI(w.toLocaleLowerCase('tr'))

const nameCap = new Map() // anahtar -> büyük harfle geçiş sayısı
const nameLow = new Map() // aynı kelimenin gerçekten küçük harfli geçişleri
const namePair = new Map()
const nameSurf = new Map()
const nameDocs = new Map()
for (const d of docs) {
  d.cased.forEach((w, i) => {
    if (!CAPRE.test(w)) {
      const lk = norm(w)
      nameLow.set(lk, (nameLow.get(lk) || 0) + 1)
      return
    }
    if (d.starts.has(i)) return
    const key = norm(w)
    if (STOP.has(key) || MONTHS.has(key) || SELF.has(key) || EN_TITLE.has(key)) return
    // başlıktan sızan çekimli tamlama: "Geometrisinin", "Anatomisi" (2+ harflik ek)
    if (key.length - stem(key).length >= 2) return
    if (/^[IVXLC]+$/.test(w)) return // roma rakamı (III, VII)
    if (key === 'anatomisi') return // başlıktan sızan
    nameCap.set(key, (nameCap.get(key) || 0) + 1)
    ;(nameSurf.get(key) || nameSurf.set(key, new Map()).get(key)).set(
      dotI(w),
      ((nameSurf.get(key) || new Map()).get(dotI(w)) || 0) + 1,
    )
    ;(nameDocs.get(key) || nameDocs.set(key, new Map()).get(key)).set(
      d.slug,
      (nameDocs.get(key).get(d.slug) || 0) + 1,
    )
    const prev = d.cased[i - 1]
    if (i > 0 && CAPRE.test(prev) && !d.starts.has(i - 1)) {
      const pk = `${norm(prev)} ${key}`
      if (!STOP.has(norm(prev)) && !MONTHS.has(norm(prev)) && !SELF.has(norm(prev)))
        namePair.set(pk, (namePair.get(pk) || 0) + 1)
    }
  })
}
// küçük harfle de yaygın geçenler ad değildir (Ilke -> ilke, Insan -> insan)
const isName = (key) => {
  const cap = nameCap.get(key) || 0
  const low = nameLow.get(key) || 0
  return cap >= 8 && cap / (cap + low) >= 0.75
}
// PDF çıkarımında son harfi düşmüş kırık biçimleri at ("Bat" varken "Batı" da varsa)
const truncated = (key) => {
  for (const other of nameCap.keys()) {
    if (other === key || !other.startsWith(key)) continue
    if (other.length - key.length <= 2 && (nameCap.get(other) || 0) >= nameCap.get(key) * 0.5)
      return true
  }
  return false
}

// ikili adlar: "Bell Labs", "New York" — parçaları tek tek listelenmesin
const pairs = [...namePair.entries()].filter(([k, n]) => {
  const [a, b] = k.split(' ')
  return n >= 8 && isName(a) && isName(b)
})
const inPair = new Map()
for (const [k, n] of pairs)
  for (const part of k.split(' ')) inPair.set(part, (inPair.get(part) || 0) + n)

const names = new Map()
for (const key of nameCap.keys()) {
  if (!isName(key) || truncated(key)) continue
  // çoğunlukla bir ikilinin parçasıysa tek başına listeleme
  if ((inPair.get(key) || 0) / nameCap.get(key) >= 0.6) continue
  names.set(key, {
    tf: nameCap.get(key),
    df: nameDocs.get(key).size,
    docs: nameDocs.get(key),
    surf: nameSurf.get(key),
    near: new Map(),
  })
}
for (const [k, n] of pairs) {
  const [a, b] = k.split(' ')
  const docsOf = new Map()
  for (const d of docs) {
    let c = 0
    d.cased.forEach((w, i) => {
      if (i > 0 && !d.starts.has(i - 1) && norm(w) === b && norm(d.cased[i - 1]) === a) c++
    })
    if (c) docsOf.set(d.slug, c)
  }
  const surfTop = [...(nameSurf.get(a) || new Map()).entries()].sort((x, y) => y[1] - x[1])[0]
  const surfTop2 = [...(nameSurf.get(b) || new Map()).entries()].sort((x, y) => y[1] - x[1])[0]
  names.set(k, {
    tf: n,
    df: docsOf.size,
    docs: docsOf,
    surf: new Map([[`${surfTop?.[0] || a} ${surfTop2?.[0] || b}`, n]]),
    near: new Map(),
  })
}

const N = docs.length
const idf = (e) => Math.log(N / e.df)

// 1) en sık kavramlar
const concepts = pack(uni, { minDf: 8, limit: 200, withNear: true })
// 2) tamlamalar — yalnızca terim gibi duranlar
const phrases = pack(bi, {
  minDf: 6,
  limit: 100,
  withNear: false,
  surfaceLabel: true,
  keep: (k, e) => isTerm([...e.surf.entries()].sort((a, b) => b[1] - a[1])[0][0], k),
})
// 3) belirgin kavramlar — korpusun ortak dili değil, ona özgü olan (tf-idf)
const distinct = pack(uni, {
  minDf: 3,
  minTf: 25,
  limit: 150,
  withNear: true,
  score: (e) => e.tf * idf(e),
})

// 4) özel adlar
const nameList = pack(names, { minDf: 2, limit: 120, withNear: false, surfaceLabel: true })

const out = {
  _not: 'scripts/build-kavramlar.js üretir — elle düzenleme.',
  docs: docs.length,
  tokens: totalTokens,
  vocab: vocab.size,
  concepts,
  phrases,
  distinct,
  names: nameList,
}
writeFileSync(join(root, 'public', 'kavramlar.json'), JSON.stringify(out))
const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024)
console.log(
  `[kavramlar] ${docs.length} yazı, ${totalTokens.toLocaleString('tr')} kelime, ${vocab.size.toLocaleString('tr')} farklı biçim -> ` +
    `${concepts.length} kavram + ${phrases.length} tamlama + ${distinct.length} belirgin + ${nameList.length} ad (${kb} KB)`,
)
