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
    recIntro: 'Okuduğum ve işime yarayan kaynaklar — isimler, siteler, belgeler.',
    ask: 'Sor',
    askIntro: 'Bir durum yaz, sana makale değil kural döner: ne yapılacak, nerede geçmez, sınandı mı.',
    askPlaceholder: 'Ör. şemayı kesintisiz nasıl değiştiririm, ekibi neye göre ölçmeliyim…',
    askLede: 'Duvarlardan kurulan cevap:',
    askSend: 'Sor',
    askThinking: 'Düşünüyor…',
    askKeySet: 'API anahtarı tanımlı — değiştir',
    askKeyMissing: 'Gerçek cevap için Anthropic API anahtarını gir',
    askKeyNote: 'Anahtar yalnızca bu tarayıcıda saklanır ve doğrudan Anthropic\u2019e gider — bu sitede sunucu yok, araya kimse girmiyor. Ücret senin hesabına yansır.',
    askRefused: 'Model bu soruyu yanıtlamayı reddetti.',
    askTruncated: 'Cevap uzunluk sınırına takıldı, sonu eksik olabilir.',
    askFallbackNote: 'Anahtar girilmediği için soru anlaşılmadı, yalnızca kelime eşleştirildi. Eşleşen duvarlar:',

    askBreaks: 'Nerede geçmez',
    askTested: 'Sınandı',
    askUntested: 'Bu kural henüz hiçbir dış kaynağa karşı sınanmadı — akıl yürütmeyle konuldu.',
    askNoRule: 'Bu konuda kayıtlı bir kural yok. Elde yalnızca okunacak metin var:',
    askNothing: 'Ne kural ne yazı eşleşti. Belki de bu bir duvar adayı — çarparsan kaydet.',
    lblTested: 'Sınandı',
    localShelf: 'Yerel kütüphane',
    localShelfNote: 'Telifli üçüncü taraf belgeleri. Yalnızca senin bilgisayarında, siteye çıkmıyor.',
    recEmpty: 'Yakında — önerilen isimler ve siteleri burada paylaşılacak.',
    projects: 'Projeler',
    wallsFound: 'İlgili duvarlar',
    sortLabel: 'Sıralama',
    sortNewest: 'En yeni',
    sortPriority: 'Kriz önceliği',
    priorityHint: 'Kriz anında öncelik puanı (10 üzerinden): yüksek olan doğrudan uygulanabilir bir yapı verir.',
    projectsIntro: 'Geliştirdiğim projeler.',
    projectsLive: 'Canlı ↗',
    ai: 'Yapay Zekâ',
    aiIntro: 'Yapay Zekâ bölümü.',
    aiEmpty: 'Yakında.',
    walls: 'Duvarlar',
    wallsIntro:
      'Arşivdeki makalelerden süzülmüş taşınabilir kurallar. Her kural bir duvar: nerede geçerli, nerede kırıldığı ve neyi engellediği yazılıdır. Bir sorunla karşılaştığında “bu duvara daha önce çarpılmış mı, nedeni neydi” diye sor.',
    wallsSearch: 'Duvarlarda ara: köşe, gerekçe, atıf gücü, Goodhart…',
    wallsUnit: 'duvar',
    lblRule: 'Kural',
    lblBreaks: 'Kırılır',
    lblReason: 'Neden',
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
    recIntro: 'Sources I read and find useful — people, sites, documents.',
    ask: 'Ask',
    askIntro: 'Describe a situation and you get a rule, not an article: what to do, where it fails, whether it was tested.',
    askPlaceholder: 'e.g. how do I change the schema without downtime, what should I measure the team on…',
    askLede: 'Answer built from the walls:',
    askSend: 'Ask',
    askThinking: 'Thinking…',
    askKeySet: 'API key set — change it',
    askKeyMissing: 'Enter your Anthropic API key for a real answer',
    askKeyNote: 'The key is stored in this browser only and goes straight to Anthropic — this site has no server in between. Usage is billed to your account.',
    askRefused: 'The model declined to answer this question.',
    askTruncated: 'The answer hit the length limit and may be cut short.',
    askFallbackNote: 'Without a key the question is not understood, only word-matched. Matching walls:',

    askBreaks: 'Where it fails',
    askTested: 'Tested',
    askUntested: 'This rule has not yet been tested against any outside source — it was reasoned, not observed.',
    askNoRule: 'No recorded rule for this. All that exists is text to read:',
    askNothing: 'Neither a rule nor an article matched. Perhaps this is a candidate wall — record it when you hit it.',
    lblTested: 'Tested against',
    localShelf: 'Local library',
    localShelfNote: 'Third-party copyrighted documents. Visible only on your machine; never published.',
    recEmpty: 'Coming soon — recommended names and their sites will appear here.',
    projects: 'Projects',
    wallsFound: 'Related walls',
    sortLabel: 'Sort',
    sortNewest: 'Newest',
    sortPriority: 'Crisis priority',
    priorityHint: 'Crisis-priority score out of 10: higher means it hands you a structure you can apply directly.',
    projectsIntro: 'Projects I have built.',
    projectsLive: 'Live ↗',
    ai: 'AI',
    aiIntro: 'AI section.',
    aiEmpty: 'Coming soon.',
    walls: 'Walls',
    wallsIntro:
      'Transferable rules distilled from the essays. Each rule is a wall: where it holds, where it breaks, and what failure it prevents. When you hit a problem, ask “has this wall been hit before, and why?”',
    wallsSearch: 'Search walls: corner, rationale, attribution power, Goodhart…',
    wallsUnit: 'walls',
    lblRule: 'Rule',
    lblBreaks: 'Breaks when',
    lblReason: 'Why',
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
