import { useEffect, useState } from 'react'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Önerilen kaynaklar. İçerik public/recommendations.json'dan okunur:
//   [{ "name": "İsim", "url": "https://...", "note": "kısa açıklama (opsiyonel)" }]
//
// Ayrıca yerel-yalnız kütüphane (yerel/posts.local.json) SADECE dev
// sunucusunda ayrı bir bölüm olarak listelenir. O klasör gitignore'da ve
// public/ dışında olduğu için ne depoya ne derlemeye girer; üretimde
// /yerel/... diye bir yol yoktur, bu istek de hiç yapılmaz.
function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function Oneriler() {
  const { t, lang } = useLang()
  const [items, setItems] = useState(null)
  const [yerel, setYerel] = useState([])

  useHead({ title: t('recommendations'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}recommendations.json`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))

    if (import.meta.env.DEV) {
      fetch('/yerel/posts.local.json')
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setYerel(Array.isArray(d) ? d : []))
        .catch(() => setYerel([])) // yerel kütüphane yoksa sessizce geç
    }
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
              {it.url ? (
                <a
                  className="rec-link"
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="rec-name">{it.name}</span>
                  <span className="rec-host">{host(it.url)} ↗</span>
                </a>
              ) : (
                // Linksiz kayıt: yalnızca ad. Bağlantısı olmayan başvuru
                // yayınları için — adı dursun yeter.
                <span className="rec-link rec-link-plain">
                  <span className="rec-name">{it.name}</span>
                </span>
              )}
              {it.note && <p className="rec-note">{it.note}</p>}
            </li>
          ))}
        </ul>
      )}

      {yerel.length > 0 && (
        <section className="local-shelf">
          <h2 className="local-shelf-head">{t('localShelf')}</h2>
          <p className="local-shelf-note">{t('localShelfNote')}</p>
          <ul className="rec-list">
            {yerel.map((it) => (
              <li key={it.slug} className="rec-item">
                <a
                  className="rec-link"
                  href={`/yerel/pdfs/${it.pdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="rec-name">
                    {lang === 'en' && it.title_en ? it.title_en : it.title}
                  </span>
                  <span className="rec-host">PDF ↗</span>
                </a>
                {(lang === 'en' && it.description_en ? it.description_en : it.description) && (
                  <p className="rec-note">
                    {lang === 'en' && it.description_en ? it.description_en : it.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
