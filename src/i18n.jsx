import { createContext, useContext, useEffect, useState } from 'react'

// Arayüz (chrome) çevirileri. Makale başlık/açıklamaları PDF diliyle (Türkçe) kalır.
export const TRANSLATIONS = {
  tr: {
    role: 'Bilgisayar Mühendisi, Yıldız Teknik Üniversitesi',
    intro1:
      'Üzerine düşünmeye değer bulduğum konuları uzun metinler halinde burada topluyorum. Alanlar geniş bir yelpazeye yayılır — mühendislik, felsefe, jeopolitik, üretim sistemleri, estetik — ve her biri kendi bağlamında, ayrıntılı biçimde ele alınır.',
    intro2:
      'Kimi zaman alanlar arasında beklenmedik bağlar belirir, kimi zaman bir konu tek başına derinleşir; her iki durumu da olduğu gibi bırakıyorum.',
    introQuote:
      'Her problem, mühendisliğe ulaşmadan önce tasarımda çözülmelidir — açıklık koddan daha iyi ölçeklenir.',
    startHere: 'Buradan başla',
    themesLabel: 'Temalar',
    themeCount: 'yazı',
    exploreTheme: 'Temayı incele →',
    portraitButton: 'Bu yazar kim? — yapay zekâ ile tanı',
    portraitSubtitle: 'Yapay zekânın gözünden',
    portraitIdeas: 'Tekrar eden fikirler',
    portraitMoves: 'Karakteristik hamleler',
    portraitRange: 'Kapsam',
    portraitHonest: 'Dürüst bir not',
    portraitStarters: 'Nereden başlamalı',
    portraitFooter: 'yazıdan üretildi',
    portraitClose: 'Kapat',
    portraitLoading: 'Yükleniyor…',
    askAiButton: 'Yazdıklarımı kendi yapay zekânda incele',
    askAiEyebrow: 'Kendi sohbetinde konuş',
    askAiIntro:
      'Tüm yazıları kendi yapay zekâna aktar ve orada konuş — özet iste, soru sor, hangisini okuman gerektiğini sor. Kendi hesabın, kendi sohbetin.',
    askAiCopy: 'Yazıları kopyala',
    askAiCopied: 'Kopyalandı ✓ — sohbetine yapıştır',
    askAiChatGPT: "ChatGPT'de aç",
    askAiClaude: "Claude'da aç",
    askAiFullNote: 'Tam metin (NotebookLM veya uzun-bağlam için):',
    askAiPrefix:
      'Aşağıda Ömer Faruk Yavuz’un tüm yazılarının başlık ve özetleri var. Bunları oku ve benimle bu yazılar üzerine konuş: özetle, soru sorduğumda yanıtla, ilgime göre hangisini okumam gerektiğini öner.',
    askAiPrompt:
      'Ömer Faruk Yavuz’un yazılarını şu adresten oku ve benimle bunlar üzerine konuş (özet, öneri, soru-cevap):',
    loading: 'Yükleniyor…',
    error: 'Hata',
    allPosts: '← Tüm yazılar',
    openNewTab: 'Yeni sekmede aç',
    download: 'PDF indir',
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
    contact: 'İletişim',
    writings: 'Yazılar',
    guides: 'Rehberler',
    music: 'Müzik',
    recommendations: 'Öneriler',
    recIntro: 'Takip etmeye değer bulduğum isimler ve siteleri.',
    recEmpty: 'Yakında — önerilen isimler ve siteleri burada paylaşılacak.',
    projects: 'Projeler',
    projectsIntro: 'GitHub’daki açık kaynak projelerim.',
    projectsLive: 'Canlı ↗',
    relatedPosts: 'İlgili Yazılar',
    citeTitle: 'Bu yazıya şöyle atıf yapabilirsin',
    citeCopy: 'Atfı kopyala',
    citeBibtex: 'BibTeX',
    citeCopied: 'Kopyalandı ✓',
    locale: 'tr-TR',
  },
  en: {
    role: 'Computer Engineer, Yıldız Technical University',
    intro1:
      'I collect the topics I find worth thinking about here, as long-form pieces. They span a wide range — engineering, philosophy, geopolitics, production systems, aesthetics — and each is treated in its own context, in detail.',
    intro2:
      'Sometimes unexpected connections appear between fields; sometimes a single topic deepens on its own. I leave both as they are.',
    introQuote:
      'Every problem must be solved in design before it reaches engineering — clarity scales better than code.',
    startHere: 'Start here',
    themesLabel: 'Themes',
    themeCount: 'posts',
    exploreTheme: 'Explore theme →',
    portraitButton: 'Who is this author? — meet via AI',
    portraitSubtitle: "Through an AI's eyes",
    portraitIdeas: 'Recurring ideas',
    portraitMoves: 'Characteristic moves',
    portraitRange: 'Range',
    portraitHonest: 'An honest note',
    portraitStarters: 'Where to start',
    portraitFooter: 'pieces',
    portraitClose: 'Close',
    portraitLoading: 'Loading…',
    askAiButton: 'Explore my writing in your own AI',
    askAiEyebrow: 'Talk in your own chat',
    askAiIntro:
      'Load all the writing into your own AI and talk to it there — ask for a summary, ask questions, ask what to read. Your account, your chat.',
    askAiCopy: 'Copy the writing',
    askAiCopied: 'Copied ✓ — paste into your chat',
    askAiChatGPT: 'Open in ChatGPT',
    askAiClaude: 'Open in Claude',
    askAiFullNote: 'Full text (for NotebookLM or long context):',
    askAiPrefix:
      "Below are the titles and summaries of all of Ömer Faruk Yavuz's writing. Read them and talk with me about them: summarize, answer my questions, and suggest what I should read based on my interests.",
    askAiPrompt:
      "Read Ömer Faruk Yavuz's writing from this URL and talk with me about it (summary, suggestions, Q&A):",
    loading: 'Loading…',
    error: 'Error',
    allPosts: '← All posts',
    openNewTab: 'Open in new tab',
    download: 'Download PDF',
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
    contact: 'Contact',
    writings: 'Writings',
    guides: 'Guides',
    music: 'Music',
    recommendations: 'Recommendations',
    recIntro: 'People and sites worth following.',
    recEmpty: 'Coming soon — recommended names and their sites will appear here.',
    projects: 'Projects',
    projectsIntro: 'My open-source projects on GitHub.',
    projectsLive: 'Live ↗',
    relatedPosts: 'Related Writings',
    citeTitle: 'Here’s how to cite this',
    citeCopy: 'Copy citation',
    citeBibtex: 'BibTeX',
    citeCopied: 'Copied ✓',
    locale: 'en-US',
  },
}

// Seri (kategori) adlarının İngilizce karşılıkları — chip'ler ve yazı meta satırı için.
export const SERIES_EN = {
  'Öğrenen Sistemler & Organizasyon': 'Learning Systems & Organization',
  'Yazılım Pratiği & Rehberler': 'Software Practice & Guides',
  'Tasarım, Strateji & Toplum': 'Design, Strategy & Society',
  'İnsan, Zihin & Davranış': 'Mind, Behavior & the Human',
  'Sistem & Düşünme': 'Systems & Thinking',
  'Yapay Zekâ Çağı': 'The AI Era',
  'Kurumlar & Bilim Tarihi': 'Institutions & History of Science',
  Müzik: 'Music',
  'Studiolo & Entelektüel Mekân': 'Studiolo & Intellectual Space',
  'Mühendislik Felsefesi & Kültürü': 'Engineering Philosophy & Culture',
  'Davranış Uzayı & Yazılım': 'Behavior Space & Software',
}

export function seriesLabel(name, lang) {
  return lang === 'en' ? SERIES_EN[name] || name : name
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
