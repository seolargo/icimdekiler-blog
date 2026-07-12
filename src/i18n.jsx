import { createContext, useContext, useEffect, useState } from 'react'

// Arayüz (chrome) çevirileri. Makale başlık/açıklamaları PDF diliyle (Türkçe) kalır.
export const TRANSLATIONS = {
  tr: {
    role: 'Bilgisayar Mühendisi, Yıldız Teknik Üniversitesi',
    intro1:
      'Yazılım mühendisliğinde bilişsel evrim çerçevesini uyguluyorum — benzerlik tanıma, kümeleme, görsel ve soyut düşünme, modüler ve genelleştirilmiş tasarımdan; evrimsel, niyet-odaklı ve düşünümsel-uyarlanabilir sistem düşüncesine ve kendini geliştiren mimarilere uzanan bir yelpazede.',
    intro2:
      'Öğrenen, evrilen ve insanın niyet ve ihtiyaçlarıyla hizalanan sistemler kurmaya odaklıyım.',
    introQuote:
      'Her problem, mühendisliğe ulaşmadan önce tasarımda çözülmelidir — açıklık koddan daha iyi ölçeklenir.',
    loading: 'Yükleniyor…',
    error: 'Hata',
    allPosts: '← Tüm yazılar',
    openNewTab: 'Yeni sekmede aç',
    download: 'İndir',
    share: 'Paylaş',
    copied: 'Bağlantı kopyalandı ✓',
    notFound: 'Bu yazı bulunamadı.',
    emptyTitle: 'Henüz PDF yok.',
    prev: 'Önceki',
    next: 'Sonraki',
    searchPlaceholder: 'Yazılarda ara…',
    all: 'Tümü',
    noResults: 'Sonuç bulunamadı.',
    results: 'yazı',
    sections: 'Bölümler',
    pagesUnit: 'sayfa',
    lastUpdate: 'Son güncelleme',
    writings: 'Yazılar',
    music: 'Müzik',
    locale: 'tr-TR',
  },
  en: {
    role: 'Computer Engineer, Yıldız Technical University',
    intro1:
      'Applying a cognitive evolution framework in software engineering — spanning similarity recognition, clustering, visual, abstraction, modular and generalized design, to evolutionary, intent-oriented, and reflective–adaptive system thinking with self-improving architectures.',
    intro2:
      'Focused on building systems that learn, evolve, and align with human intent and needs.',
    introQuote:
      'Every problem must be solved in design before it reaches engineering — clarity scales better than code.',
    loading: 'Loading…',
    error: 'Error',
    allPosts: '← All posts',
    openNewTab: 'Open in new tab',
    download: 'Download',
    share: 'Share',
    copied: 'Link copied ✓',
    notFound: 'Post not found.',
    emptyTitle: 'No PDFs yet.',
    prev: 'Previous',
    next: 'Next',
    searchPlaceholder: 'Search posts…',
    all: 'All',
    noResults: 'No results.',
    results: 'posts',
    sections: 'Sections',
    pagesUnit: 'pages',
    lastUpdate: 'Last updated',
    writings: 'Writings',
    music: 'Music',
    locale: 'en-US',
  },
}

const LangContext = createContext({ lang: 'tr', setLang: () => {}, t: (k) => k })

function initialLang() {
  if (typeof window === 'undefined') return 'tr'
  const saved = window.localStorage.getItem('lang')
  if (saved === 'tr' || saved === 'en') return saved
  return navigator.language?.startsWith('en') ? 'en' : 'tr'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    window.localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = (key) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.tr[key] ?? key
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
