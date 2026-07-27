import { useEffect, useState } from 'react'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Önerilen isimler ve siteleri. İçerik public/recommendations.json'dan okunur:
//   [{ "name": "İsim", "url": "https://...", "note": "kısa açıklama (opsiyonel)" }]
function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function Oneriler() {
  const { t } = useLang()
  const [items, setItems] = useState(null)

  useHead({ title: t('recommendations'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}recommendations.json`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
  }, [])

  return (
    <>
      <p className="rec-intro muted">{t('recIntro')}</p>

      {items === null && <p className="muted">{t('loading')}</p>}

      {items?.length === 0 && <p className="muted rec-empty">{t('recEmpty')}</p>}

      {items?.length > 0 && (
        <ul className="rec-list">
          {items.map((it, i) => (
            <li key={i} className="rec-item">
              <a
                className="rec-link"
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="rec-name">{it.name}</span>
                {it.url && <span className="rec-host">{host(it.url)} ↗</span>}
              </a>
              {it.note && <p className="rec-note">{it.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
