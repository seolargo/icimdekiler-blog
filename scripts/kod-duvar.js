#!/usr/bin/env node
// Kod duvarlarını kod yazarken önüne getirir — paperlardan türetilmiş kontrol maddeleri.
//
// Kullanım (herhangi bir projenin içinden):
//   node /yol/pdf-blog/scripts/kod-duvar.js --an B            # bitirmeden önce
//   node /yol/pdf-blog/scripts/kod-duvar.js --an Y --diff     # yazarken, değişen dosyalara göre
//   node /yol/pdf-blog/scripts/kod-duvar.js retry kuyruk      # konu ile
//   node /yol/pdf-blog/scripts/kod-duvar.js --md              # docs/kod-duvarlari.md üret
//
// Amaç hatırlatmak değil, karar verilmeden önce ilgili kısıtı görünür kılmak.
// Her madde bir "kırılır" taşır: nerede geçerli değil. Kırılır alanı olmayan madde
// kataloğa girmez — o duvar değil, etikettir.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { fold, matchesTokens } from '../src/search.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { anlar, kurallar } = JSON.parse(readFileSync(join(root, 'public/kod-duvarlari.json'), 'utf8'))

// Dosya yolu desenlerinden konu sözcükleri. Kasıtlı olarak geniş: az sayıda
// fazladan madde göstermek, hiç göstermemekten iyidir.
const DESEN = [
  [/migrat|schema|şema|alembic|flyway|prisma\/migrations/i, ['migration', 'şema', 'geri alma']],
  [/auth|login|token|jwt|oauth|yetki|permission/i, ['yetki', 'auth', 'güvenlik']],
  [/test|spec|__tests__|e2e|cypress|jest|vitest/i, ['test', 'mock', 'coverage']],
  [/config|\.env|settings|yaml|toml|helm|terraform/i, ['config', 'dağıtım', 'yedek']],
  [/queue|kafka|rabbit|worker|job|cron|retry|outbox/i, ['kuyruk', 'retry', 'idempotency', 'yük']],
  [/cache|redis|memcach/i, ['önbellek', 'cache', 'state']],
  [/deploy|ci|pipeline|github\/workflows|docker|k8s/i, ['dağıtım', 'deploy', 'geri alma']],
  [/perf|bench|latency|profil|metric|telemetry/i, ['performans', 'metrik', 'p99', 'ölçüm']],
  [/api|route|controller|endpoint|graphql|client|http/i, ['api', 'sözleşme', 'http', 'dış servis']],
  [/model|ml|train|prompt|llm|agent|ajan/i, ['llm', 'ajan', 'model', 'spec']],
  [/payment|order|invoice|balance|ledger|transfer/i, ['ödeme', 'transaction', 'para']],
  [/store|reducer|redux|state|signal|context/i, ['state', 'durum', 'store']],
  [/log|error|exception|sentry|trace/i, ['log', 'hata', 'trace']],
]

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const val = (n) => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : null
}

if (flag('--md')) {
  writeFileSync(join(root, 'docs/kod-duvarlari.md'), markdown())
  console.log('docs/kod-duvarlari.md yazıldı — ' + kurallar.length + ' madde')
  process.exit(0)
}

const hepsi = flag('--hepsi')
const anIdx = argv.indexOf('--an')
const an = (val('--an') || '').toUpperCase() || null
// --an'in değerini indeksle çıkar; değere göre çıkarmak küçük harf yazıldığında
// ("--an b") eşleşmez ve harf bir arama terimi olarak sızar.
let terimler = argv.filter((a, i) => !a.startsWith('--') && i !== anIdx + 1)
let baglam = []

if (an && !anlar[an]) {
  console.error(`Bilinmeyen an: ${an}. Geçerli: ${Object.keys(anlar).join(', ')}`)
  process.exit(1)
}
if (an) baglam.push(`${an} — ${anlar[an].name}`)

if (flag('--diff')) {
  let dosyalar = []
  try {
    const calistir = (c) => execSync(c, { encoding: 'utf8' }).split('\n').filter(Boolean)
    // git diff izlenmeyen dosyaları göstermez; yeni eklenen dosya en riskli
    // olandır, ayrıca sorulur.
    dosyalar = [...calistir('git diff --name-only HEAD'), ...calistir('git ls-files --others --exclude-standard')]
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
  baglam.push(`${dosyalar.length} değişen dosya → ${[...bulunan].join(', ') || 'eşleşen konu yok'}`)
}

if (!an && !terimler.length) {
  console.log('Kullanım: kod-duvar --an <T|Y|D|B|A> [--diff] [konu...] [--hepsi]')
  for (const [k, v] of Object.entries(anlar)) console.log(`  ${k}  ${v.name} — ${v.aciklama}`)
  process.exit(0)
}

const alan = (k) => fold(`${k.id} ${k.title} ${k.kural} ${k.kirilir} ${k.neden} ${k.tetik.join(' ')}`)

let havuz = an ? kurallar.filter((k) => k.an === an) : kurallar
let puanli = havuz
  .map((k) => {
    const tutan = terimler.filter((t) => matchesTokens(fold(t), alan(k), true))
    return { k, n: tutan.length, tutan }
  })
  .sort((a, b) => b.n - a.n || a.k.id.localeCompare(b.k.id))

// Konu verilmişse yalnızca tutanları göster; verilmemişse anın tamamını.
if (terimler.length) puanli = puanli.filter((x) => x.n > 0)

const goster = hepsi ? puanli : puanli.slice(0, an && !terimler.length ? 99 : 6)

const B = (s) => `\x1b[1m${s}\x1b[0m`
const D = (s) => `\x1b[2m${s}\x1b[0m`
const V = (s) => `\x1b[33m${s}\x1b[0m`

console.log()
if (baglam.length) console.log(D('  ' + baglam.join(' · ')) + '\n')
if (!goster.length) {
  console.log('  Eşleşen madde yok. Belki de bu bir kod duvarı adayıdır — çarparsan kaydet.\n')
  process.exit(0)
}
for (const { k, tutan } of goster) {
  console.log(`  ${B(k.id)}  ${B(k.title)}`)
  const etiket = [anlar[k.an]?.name, ...tutan].filter(Boolean).join(', ')
  console.log(`  ${D(etiket)}`)
  console.log(`\n  ${k.kural}`)
  console.log(`\n  ${V('KIRILIR')}  ${k.kirilir}`)
  console.log(`  ${D('kaynak: ' + k.kaynak.join(', '))}`)
  console.log(`\n  ${D('─'.repeat(68))}\n`)
}
if (!hepsi && puanli.length > goster.length) {
  console.log(D(`  +${puanli.length - goster.length} madde daha — hepsi için --hepsi\n`))
}

function markdown() {
  const satir = []
  satir.push('# Kod Duvarları')
  satir.push('')
  satir.push(
    'Korpustaki mühendislik paperlarından türetilmiş, kod yazarken uygulanabilir kurallar.',
  )
  satir.push(
    'Her madde bir **kırılır** taşır: nerede geçerli değil. Kırılır alanı olmayan madde',
  )
  satir.push('kataloğa girmez — o duvar değil, etikettir.')
  satir.push('')
  satir.push('`public/kod-duvarlari.json` ile bu dosya **eşit tutulacak**.')
  satir.push('Bu dosya elle düzenlenmez: `npm run kod-duvar -- --md` ile üretilir.')
  satir.push('')
  satir.push('Hepsini birden uygulama — **KOD-06** derinliği tehlikeye göre seçer.')
  satir.push('')
  satir.push('| An | Ne zaman |')
  satir.push('|---|---|')
  for (const [k, v] of Object.entries(anlar)) satir.push(`| **${k}** ${v.name} | ${v.aciklama} |`)
  satir.push('')
  for (const [kod, v] of Object.entries(anlar)) {
    const grup = kurallar.filter((k) => k.an === kod)
    if (!grup.length) continue
    satir.push(`## ${v.name}`)
    satir.push('')
    satir.push(`*${v.aciklama}*`)
    satir.push('')
    for (const k of grup) {
      satir.push(`### ${k.id} — ${k.title}`)
      satir.push('')
      satir.push(k.kural)
      satir.push('')
      satir.push(`**Kırılır:** ${k.kirilir}`)
      satir.push('')
      satir.push(`**Neden:** ${k.neden}`)
      satir.push('')
      satir.push(`*Kaynak: ${k.kaynak.join(', ')}*`)
      satir.push('')
    }
  }
  return satir.join('\n') + '\n'
}
