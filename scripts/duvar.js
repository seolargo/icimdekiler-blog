#!/usr/bin/env node
// Duvarları işin başındayken önüne getirir — aramaya gitmen gerekmez.
//
// Kullanım (herhangi bir projenin içinden):
//   node /yol/pdf-blog/scripts/duvar.js kesinti kuyruk idempotency
//   node /yol/pdf-blog/scripts/duvar.js --diff        # git diff'teki dosyalardan çıkar
//   node /yol/pdf-blog/scripts/duvar.js --diff --hepsi
//
// --diff kipi, değişen dosya yollarını konu sözcüklerine çevirir (migration →
// göç/şema, auth → yetki, test → sınama…) ve eşleşen duvarları basar. Amaç
// hatırlatmak değil, kararı vermeden önce ilgili kısıtı görünür kılmak.
import { readFileSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { fold, matchesTokens } from '../src/search.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { walls, themes } = JSON.parse(readFileSync(join(root, 'public/duvarlar.json'), 'utf8'))

// Dosya yolu / dal adı desenlerinden konu sözcükleri. Kasıtlı olarak geniş:
// az sayıda fazladan duvar göstermek, hiç göstermemekten iyidir.
const DESEN = [
  [/migrat|schema|şema|alembic|flyway|prisma\/migrations/i, ['göç', 'şema', 'geri alma', 'artımlı']],
  [/auth|login|token|jwt|oauth|yetki/i, ['yetki', 'kimlik', 'sınır']],
  [/test|spec|__tests__|e2e|cypress|jest|vitest/i, ['test', 'ölçüt', 'sınama', 'doğrulama']],
  [/config|\.env|settings|yaml|toml|helm|terraform/i, ['yapılandırma', 'ortam', 'yedeklilik']],
  [/queue|kafka|rabbit|worker|job|cron|retry/i, ['kuyruk', 'yeniden deneme', 'kesinti', 'idempotency']],
  [/cache|redis|memcach/i, ['önbellek', 'tutarlılık', 'kesinti']],
  [/deploy|ci|pipeline|github\/workflows|docker|k8s/i, ['dağıtım', 'geri alma', 'sapma']],
  [/perf|bench|latency|profil/i, ['ölçüm', 'başarım', 'oran', 'bağlam']],
  [/api|route|controller|endpoint|graphql/i, ['sözleşme', 'sınır', 'arayüz']],
  [/model|ml|train|prompt|llm|agent/i, ['belirsizlik', 'model', 'kör nokta']],
  [/refactor|rename|move|cleanup/i, ['gerekçe', 'aşınma', 'yeniden yapılandırma']],
]

const argv = process.argv.slice(2)
const hepsi = argv.includes('--hepsi')
const diffKipi = argv.includes('--diff')
let terimler = argv.filter((a) => !a.startsWith('--'))
let baglam = ''

if (diffKipi) {
  let dosyalar = []
  try {
    const calistir = (c) => execSync(c, { encoding: 'utf8' }).split('\n').filter(Boolean)
    // git diff izlenmeyen dosyaları göstermez; yeni eklenen dosya en riskli
    // olandır, ayrıca sorulur.
    dosyalar = [
      ...calistir('git diff --name-only HEAD'),
      ...calistir('git ls-files --others --exclude-standard'),
    ]
    if (!dosyalar.length) dosyalar = calistir('git diff --name-only HEAD~1 HEAD')
    dosyalar = [...new Set(dosyalar)]
  } catch {
    console.error('git diff okunamadı — bir git deposunun içinde misin?')
    process.exit(1)
  }
  const bulunan = new Set()
  for (const f of dosyalar) {
    for (const [re, kelimeler] of DESEN) if (re.test(f)) kelimeler.forEach((k) => bulunan.add(k))
  }
  terimler = [...terimler, ...bulunan]
  baglam = `${dosyalar.length} değişen dosya → ${[...bulunan].join(', ') || 'eşleşen konu yok'}`
}

if (!terimler.length) {
  console.log('Kullanım: duvar <konu...>  |  duvar --diff [--hepsi]')
  process.exit(0)
}

const alan = (w) =>
  fold(
    `${w.id} ${w.title} ${w.kural} ${w.kirilir} ${w.neden} ${w.kaynak.join(' ')} ` +
      (w.sinama || []).map((x) => `${x.kaynak} ${x.not}`).join(' '),
  )

// Kaç terim tutuyorsa o kadar güçlü eşleşme
const puanli = walls
  .map((w) => {
    const hay = alan(w)
    const tutan = terimler.filter((t) => matchesTokens(fold(t), hay, true))
    return { w, n: tutan.length, tutan }
  })
  .filter((x) => x.n > 0)
  .sort((a, b) => b.n - a.n || a.w.id.localeCompare(b.w.id))

const goster = hepsi ? puanli : puanli.slice(0, 5)

const B = (s) => `\x1b[1m${s}\x1b[0m`
const D = (s) => `\x1b[2m${s}\x1b[0m`
const V = (s) => `\x1b[33m${s}\x1b[0m`

console.log()
if (baglam) console.log(D(`  ${baglam}`) + '\n')
if (!goster.length) {
  console.log('  Eşleşen duvar yok. Belki de bu bir duvar adayıdır — çarparsan kaydet.\n')
  process.exit(0)
}

for (const { w, tutan } of goster) {
  console.log(`  ${B(w.id)}  ${B(w.title)}`)
  console.log(`  ${D(themes[w.t]?.name || w.t)} · ${D(tutan.join(', '))}`)
  console.log(`\n  ${w.kural}`)
  console.log(`\n  ${V('KIRILIR')}  ${w.kirilir}`)
  for (const x of w.sinama || []) {
    console.log(`  ${D(`SINANDI (${x.tarih}, ${x.sonuc}) — ${x.kaynak}`)}`)
  }
  console.log(`\n  ${D('─'.repeat(68))}\n`)
}

if (!hepsi && puanli.length > goster.length) {
  console.log(D(`  +${puanli.length - goster.length} duvar daha — hepsi için --hepsi\n`))
}
