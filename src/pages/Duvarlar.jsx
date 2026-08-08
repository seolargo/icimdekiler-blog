import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Duvarlar — korpustan türetilen taşınabilir kurallar kataloğu.
// Veri public/duvarlar.json'dan okunur ({ themes, walls }).
// İçerik (kural/kırılır/neden) makale diliyle (Türkçe) kalır; yalnızca arayüz çevrilir.

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

export default function Duvarlar() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [theme, setTheme] = useState('all')

  // ana sayfadaki aramadan gelindiğinde sorguyu devral
  useEffect(() => {
    const incoming = params.get('q')
    if (incoming) setQ(incoming)
  }, [params])

  useHead({ title: t('walls'), description: t('wallsIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}duvarlar.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ themes: {}, walls: [] }))
  }, [])

  const themes = data?.themes || {}
  const walls = data?.walls || []
  const themeName = (k) => (lang === 'en' && themes[k]?.name_en ? themes[k].name_en : themes[k]?.name) || k

  const counts = useMemo(() => {
    const c = {}
    for (const w of walls) c[w.t] = (c[w.t] || 0) + 1
    return c
  }, [walls])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr')
    return walls.filter((w) => {
      if (theme !== 'all' && w.t !== theme) return false
      if (!needle) return true
      const sinama = (w.sinama || [])
        .map((x) => `${x.kaynak} ${x.not} ${x.sonuc}`)
        .join(' ')
      const hay =
        `${w.id} ${w.title} ${w.kural} ${w.kirilir} ${w.neden} ${w.kaynak.join(' ')} ${sinama}`.toLocaleLowerCase('tr')
      return hay.includes(needle)
    })
  }, [walls, q, theme])

  const pickSource = (src) => {
    setTheme('all')
    setQ(src)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (data === null) return <p className="muted">{t('loading')}</p>

  return (
    <div className="dv">
      <p className="dv-intro">{t('wallsIntro')}</p>

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
            placeholder={t('wallsSearch')}
            aria-label={t('wallsSearch')}
          />
        </div>
        <div className="dv-chips" role="group" aria-label={t('themesLabel')}>
          <button
            type="button"
            className={`dv-chip${theme === 'all' ? ' is-active' : ''}`}
            aria-pressed={theme === 'all'}
            onClick={() => setTheme('all')}
          >
            {t('all')} <span className="dv-n">{walls.length}</span>
          </button>
          {Object.keys(themes).map((k) => (
            <button
              key={k}
              type="button"
              className={`dv-chip${theme === k ? ' is-active' : ''}`}
              aria-pressed={theme === k}
              onClick={() => setTheme(k)}
              data-theme={k}
            >
              <span className="dv-dot" data-theme={k} aria-hidden="true" />
              {themeName(k)} <span className="dv-n">{counts[k] || 0}</span>
            </button>
          ))}
        </div>
        <p className="dv-count">
          <b>{filtered.length}</b> / {walls.length} {t('wallsUnit')}
          {theme !== 'all' && <> · {themeName(theme)}</>}
          {q.trim() && <> · “{q.trim()}”</>}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="muted dv-empty">{t('noResults')}</p>
      ) : (
        <ul className="dv-list">
          {filtered.map((w) => (
            <li key={w.id} className="dv-card" data-theme={w.t}>
              <div className="dv-head">
                <span className="dv-id" data-theme={w.t}>{w.id}</span>
                <span className="dv-tag">
                  <span className="dv-dot" data-theme={w.t} aria-hidden="true" />
                  {themeName(w.t)}
                </span>
              </div>
              <h2 className="dv-title">{highlight(w.title, q.trim())}</h2>
              <div className="dv-fields">
                <div className="dv-field">
                  <span className="dv-lbl">{t('lblRule')}</span>
                  <p>{highlight(w.kural, q.trim())}</p>
                </div>
                <div className="dv-field dv-breaks">
                  <span className="dv-lbl">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1 L3.5 5 L6.5 6 L4 11" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    {t('lblBreaks')}
                  </span>
                  <p>{highlight(w.kirilir, q.trim())}</p>
                </div>
                <div className="dv-field dv-reason">
                  <span className="dv-lbl">{t('lblReason')}</span>
                  <p>{highlight(w.neden, q.trim())}</p>
                </div>
                {(w.sinama || []).length > 0 && (
                  <div className="dv-field dv-tested">
                    <span className="dv-lbl">{t('lblTested')}</span>
                    {w.sinama.map((x, i) => (
                      <div key={i} className="dv-test">
                        <span className={`dv-test-verdict v-${x.sonuc.replace(/[^a-zçğıöşü]/gi, '')}`}>
                          {x.sonuc}
                        </span>
                        <span className="dv-test-date">{x.tarih}</span>
                        <p className="dv-test-note">{highlight(x.not, q.trim())}</p>
                        <a
                          className="dv-test-src"
                          href={x.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {x.kaynak} ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dv-sources">
                  {w.kaynak.map((k) => (
                    <button key={k} type="button" className="dv-src" onClick={() => pickSource(k)}>
                      {k}
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
