import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from './i18n.jsx'

// "Bu yazar kim?" — yapay zekânın korpustan çıkardığı portreyi (public/portrait.json)
// bir modalde gösteren buton. Portre build zamanında (scripts/build-portrait.js) üretilir;
// burada yalnızca tembel yüklenir. Tıklama başına maliyet yoktur.
export default function AuthorPortrait() {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const reqRef = useRef(null)

  const load = () => {
    if (data || reqRef.current) return
    reqRef.current = fetch(`${import.meta.env.BASE_URL}portrait.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }

  const show = () => {
    load()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const paras = (s) => (s || '').split('\n\n').filter(Boolean)

  return (
    <>
      <button type="button" className="portrait-btn" onClick={show}>
        <span className="portrait-btn-spark" aria-hidden="true">✦</span>
        {t('portraitButton')}
      </button>

      {open && (
        <div className="portrait-overlay" onClick={() => setOpen(false)}>
          <div
            className="portrait-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('portraitButton')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="portrait-x"
              onClick={() => setOpen(false)}
              aria-label={t('portraitClose')}
            >
              ×
            </button>

            {!data ? (
              <p className="muted portrait-loading">{t('portraitLoading')}</p>
            ) : (
              (() => {
                const d = lang === 'en' && data.en ? { ...data, ...data.en } : data
                return (
              <div className="portrait-body">
                <p className="portrait-eyebrow">{t('portraitSubtitle')}</p>

                {paras(d.intro).map((p, i) => (
                  <p key={i} className="portrait-intro">{p}</p>
                ))}

                {d.recurringIdeas?.length > 0 && (
                  <section className="portrait-section">
                    <h3>{t('portraitIdeas')}</h3>
                    <ul className="portrait-ideas">
                      {d.recurringIdeas.map((it, i) => (
                        <li key={i}>
                          <span className="portrait-idea-name">{it.name}</span>
                          <span className="portrait-idea-desc">{it.description}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {d.moves?.length > 0 && (
                  <section className="portrait-section">
                    <h3>{t('portraitMoves')}</h3>
                    <ul className="portrait-moves">
                      {d.moves.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {d.range && (
                  <section className="portrait-section">
                    <h3>{t('portraitRange')}</h3>
                    <p>{d.range}</p>
                  </section>
                )}

                {d.honestNote && (
                  <section className="portrait-section portrait-honest">
                    <h3>{t('portraitHonest')}</h3>
                    <p>{d.honestNote}</p>
                  </section>
                )}

                {d.starters?.length > 0 && (
                  <section className="portrait-section">
                    <h3>{t('portraitStarters')}</h3>
                    <ul className="portrait-starters">
                      {d.starters.map((s, i) => (
                        <li key={i}>
                          <Link to={`/post/${s.slug}`} onClick={() => setOpen(false)}>
                            {s.title}
                          </Link>
                          {s.why && <span className="portrait-why">{s.why}</span>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {d.postCount && (
                  <p className="portrait-foot muted">
                    {d.postCount} {t('portraitFooter')}
                    {d.generatedAt ? ` · ${d.generatedAt}` : ''}
                  </p>
                )}
              </div>
                )
              })()
            )}
          </div>
        </div>
      )}
    </>
  )
}
