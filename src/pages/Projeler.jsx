import { useEffect, useState } from 'react'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Projelerim — public/projects.json'dan okunur (GitHub public repo'larından üretildi):
//   [{ "name": "...", "title": "...", "title_en": "...", "desc": "...", "lang": "...",
//     "url": "https://github.com/...", "homepage": "..." }]
// `name` depo kimliğidir (link ve React key); ekranda okunur ad (`title`) gösterilir.
export default function Projeler() {
  const { t, lang } = useLang()
  const [items, setItems] = useState(null)
  const projTitle = (it) =>
    (lang === 'en' && it.title_en ? it.title_en : it.title) || it.name

  useHead({ title: t('projects'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}projects.json`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
  }, [])

  return (
    <>
      <p className="rec-intro muted">{t('projectsIntro')}</p>

      {items === null && <p className="muted">{t('loading')}</p>}
      {items?.length === 0 && <p className="muted rec-empty">{t('recEmpty')}</p>}

      {items?.length > 0 && (
        <ul className="proj-list">
          {items.map((it) => (
            <li key={it.name} className="proj-item">
              {/* deposu olmayan proje (ör. özel repo) linksiz görünür */}
              {it.url ? (
                <a
                  className="proj-link"
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="proj-name">{projTitle(it)}</span>
                  {it.lang && <span className="proj-lang">{it.lang}</span>}
                </a>
              ) : (
                <span className="proj-link">
                  <span className="proj-name">{projTitle(it)}</span>
                  {it.lang && <span className="proj-lang">{it.lang}</span>}
                </span>
              )}
              {(lang === 'en' && it.desc_en ? it.desc_en : it.desc) && (
                <p className="proj-desc">
                  {lang === 'en' && it.desc_en ? it.desc_en : it.desc}
                </p>
              )}
              {it.homepage && (
                <a
                  className="proj-live"
                  href={it.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('projectsLive')}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
