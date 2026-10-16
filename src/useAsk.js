import { useEffect, useState } from 'react'

// Deneme bölümleri (Aşk, İnsan): scripts/build-ask.js üretir. Korpustan ayrıdır.
export const SECTION_LABEL = { ask: 'love', insan: 'human', muzik: 'music' }
export const SECTION_EMPTY = { ask: 'loveEmpty', insan: 'humanEmpty', muzik: 'loveEmpty' }

export function useAsk(section = 'ask') {
  const [state, setState] = useState({ items: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}${section}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${section}.json yüklenemedi (${r.status})`)
        return r.json()
      })
      .then((items) => alive && setState({ items, loading: false, error: null }))
      .catch((error) => alive && setState({ items: [], loading: false, error }))
    return () => {
      alive = false
    }
  }, [section])

  return state
}

// Deneme bölümlerinin yazı tipleri yalnızca bu bölüme girilince yüklenir.
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap'

export function useAskFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-ask-fonts]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.dataset.askFonts = ''
    document.head.appendChild(link)
  }, [])
}

export const ASK_FONT_HREF = FONT_HREF

// Dil düğmesine göre yazının metni; İngilizcesi yoksa Türkçesi.
export const pick = (item, lang) => (lang === 'en' && item.en ? item.en : item.tr)

export const formatDate = (iso, lang) =>
  new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
