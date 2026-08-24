import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Kod duvarları — mühendislik paperlarından türetilen, kod yazarken uygulanan kurallar.
// Veri public/kod-duvarlari.json'dan okunur ({ anlar, kurallar }).
// Duvarlar'dan farkı: temaya göre değil ANA göre bölünür (T/Y/D/B/A).
// İçerik makale diliyle (Türkçe) kalır; yalnızca arayüz çevrilir.

function highlight(text, q) {
  if (!q) return text
  const i = text.toLocaleLowerCase('tr').indexOf(q.toLocaleLowerCase('tr'))
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function KodDuvarlari() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [an, setAn] = useState(params.get('an') || 'all')

  useEffect(() => {
    const incoming = params.get('q')
    if (incoming) setQ(incoming)
  }, [params])

  useHead({ title: t('codeWalls'), description: t('codeWallsIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}kod-duvarlari.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ anlar: {}, kurallar: [] }))
  }, [])

  const anlar = data?.anlar || {}
  const kurallar = data?.kurallar || []
  const anName = (k) => anlar[k]?.name || k

  const counts = useMemo(() => {
    const c = {}
    for (const k of kurallar) c[k.an] = (c[k.an] || 0) + 1
    return c
  }, [kurallar])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr')
    return kurallar.filter((k) => {
      if (an !== 'all' && k.an !== an) return false
      if (!needle) return true
      const sinama = (k.sinama || []).map((x) => `${x.kaynak} ${x.not} ${x.sonuc}`).join(' ')
      const hay =
        `${k.id} ${k.title} ${k.kural} ${k.kirilir} ${k.neden} ${(k.kaynak || []).join(' ')} ${(k.tetik || []).join(' ')} ${sinama}`.toLocaleLowerCase(
          'tr',
        )
      return hay.includes(needle)
    })
  }, [kurallar, q, an])

  const pickSource = (src) => {
    setAn('all')
    setQ(src)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (data === null) return <p className="muted">{t('loading')}</p>

  return (
    <div className="dv">
      <p className="dv-intro">{t('codeWallsIntro')}</p>

      <div className="dv-controls">
        <div className="dv-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('codeWallsSearch')}
            aria-label={t('codeWallsSearch')}
          />
        </div>
        <div className="dv-chips" role="group" aria-label={t('momentsLabel')}>
          <button
            type="button"
            className={`dv-chip${an === 'all' ? ' is-active' : ''}`}
            aria-pressed={an === 'all'}
            onClick={() => setAn('all')}
          >
            {t('all')} <span className="dv-n">{kurallar.length}</span>
          </button>
          {Object.keys(anlar).map((k) => (
            <button
              key={k}
              type="button"
              className={`dv-chip${an === k ? ' is-active' : ''}`}
              aria-pressed={an === k}
              onClick={() => setAn(k)}
              data-theme={k}
              title={anlar[k]?.aciklama}
            >
              <span className="dv-dot" data-theme={k} aria-hidden="true" />
              {anName(k)} <span className="dv-n">{counts[k] || 0}</span>
            </button>
          ))}
        </div>
        <p className="dv-count">
          <b>{filtered.length}</b> / {kurallar.length} {t('codeWallsUnit')}
          {an !== 'all' && (
            <>
              {' '}
              · {anName(an)} — {anlar[an]?.aciklama}
            </>
          )}
          {q.trim() && <> · “{q.trim()}”</>}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="muted dv-empty">{t('noResults')}</p>
      ) : (
        <ul className="dv-list">
          {filtered.map((k) => (
            <li key={k.id} className="dv-card" data-theme={k.an}>
              <div className="dv-head">
                <span className="dv-id" data-theme={k.an}>
                  {k.id}
                </span>
                <span className="dv-tag">
                  <span className="dv-dot" data-theme={k.an} aria-hidden="true" />
                  {anName(k.an)}
                </span>
              </div>
              <h2 className="dv-title">{highlight(k.title, q.trim())}</h2>
              <div className="dv-fields">
                <div className="dv-field">
                  <span className="dv-lbl">{t('lblRule')}</span>
                  <p>{highlight(k.kural, q.trim())}</p>
                </div>
                <div className="dv-field dv-breaks">
                  <span className="dv-lbl">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M6 1 L3.5 5 L6.5 6 L4 11"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                    {t('lblBreaks')}
                  </span>
                  <p>{highlight(k.kirilir, q.trim())}</p>
                </div>
                <div className="dv-field dv-reason">
                  <span className="dv-lbl">{t('lblReason')}</span>
                  <p>{highlight(k.neden, q.trim())}</p>
                </div>
                {(k.sinama || []).length > 0 && (
                  <div className="dv-field dv-tested">
                    <span className="dv-lbl">{t('lblTested')}</span>
                    {k.sinama.map((x, i) => (
                      <div key={i} className="dv-test">
                        <span
                          className={`dv-test-verdict v-${x.sonuc.replace(/[^a-zçğıöşü]/gi, '')}`}
                        >
                          {x.sonuc}
                        </span>
                        <span className="dv-test-date">{x.tarih}</span>
                        <p className="dv-test-note">{highlight(x.not, q.trim())}</p>
                        {x.url && (
                          <a
                            className="dv-test-src"
                            href={x.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {x.kaynak} ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="dv-sources">
                  {(k.kaynak || []).map((s) => (
                    <button key={s} type="button" className="dv-src" onClick={() => pickSource(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
