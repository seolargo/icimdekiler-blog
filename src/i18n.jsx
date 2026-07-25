import { createContext, useContext, useEffect, useState } from 'react'

// Arayüz (chrome) çevirileri. Makale başlık/açıklamaları PDF diliyle (Türkçe) kalır.
export const TRANSLATIONS = {
  tr: {
    role: 'Bilgisayar Mühendisi, Yıldız Teknik Üniversitesi',
    intro1:
      'Farklı disiplinlerde aynı yapıyı arıyorum — mühendislik, felsefe, istihbarat, üretim sistemleri, Talmud. Onlarca alanda tekrar eden aynı fikirleri (izomorfizm, çeviri katmanları, görünürlük, örtük bilgi) uzun metinlerde işliyorum.',
    intro2:
      '148 belge var; ama hepsini okumana gerek yok — aşağıdan başla.',
    introQuote:
      'Her problem, mühendisliğe ulaşmadan önce tasarımda çözülmelidir — açıklık koddan daha iyi ölçeklenir.',
    startHere: 'Buradan başla',
    themesLabel: 'Temalar',
    themeCount: 'yazı',
    exploreTheme: 'Temayı incele →',
    loading: 'Yükleniyor…',
    error: 'Hata',
    allPosts: '← Tüm yazılar',
    openNewTab: 'Yeni sekmede aç',
    download: 'İndir',
    share: 'Paylaş',
    copied: 'Bağlantı kopyalandı ✓',
    copyText: 'Metni Kopyala',
    textCopied: 'Metin kopyalandı ✓',
    downloadText: 'Metni İndir',
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
    guides: 'Rehberler',
    music: 'Müzik',
    relatedPosts: 'İlgili Yazılar',
    locale: 'tr-TR',
  },
  en: {
    role: 'Computer Engineer, Yıldız Technical University',
    intro1:
      'I look for the same structure across different disciplines — engineering, philosophy, intelligence, production systems, the Talmud. The same recurring ideas (isomorphism, translation layers, visibility, tacit knowledge) worked out across dozens of fields in long-form pieces.',
    intro2:
      "148 documents — but you don't have to read them all. Start below.",
    introQuote:
      'Every problem must be solved in design before it reaches engineering — clarity scales better than code.',
    startHere: 'Start here',
    themesLabel: 'Themes',
    themeCount: 'posts',
    exploreTheme: 'Explore theme →',
    loading: 'Loading…',
    error: 'Error',
    allPosts: '← All posts',
    openNewTab: 'Open in new tab',
    download: 'Download',
    share: 'Share',
    copied: 'Link copied ✓',
    copyText: 'Copy Text',
    textCopied: 'Text copied ✓',
    downloadText: 'Download Text',
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
    guides: 'Guides',
    music: 'Music',
    relatedPosts: 'Related Writings',
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
