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
    askAiButton: 'Yazılarımı yapay zekâna ver',
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
    recommendations: 'Öneriler',
    recIntro: 'Takip etmeye değer bulduğum isimler ve siteleri.',
    recEmpty: 'Yakında — önerilen isimler ve siteleri burada paylaşılacak.',
    relatedPosts: 'İlgili Yazılar',
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
    askAiButton: 'Give my writing to your AI',
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
    recommendations: 'Recommendations',
    recIntro: 'People and sites worth following.',
    recEmpty: 'Coming soon — recommended names and their sites will appear here.',
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
