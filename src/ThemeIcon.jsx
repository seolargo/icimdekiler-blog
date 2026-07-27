// Tema kartları için ince çizgi ikonları. Tek renk (currentColor) — açık/koyu
// temaya uyar. Yeni tema eklenirse ve id eşleşmezse varsayılan (nokta) döner.
const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  // aynı yapı iki alanda — örtüşen iki halka (Venn)
  izomorfizm: (
    <>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </>
  ),
  // anlam/dil — konuşma balonu
  anlam: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z" />
    </>
  ),
  // örtük bilgi & aktarım — düğümler arası paylaşım
  'ortuk-bilgi': (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.1 10.9 15.9 7.1M8.1 13.1l7.8 3.8" />
    </>
  ),
  // görünürlük — göz
  gorunurluk: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  // mühendislik zihni — pergel
  'muhendislik-zihni': (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M11 6.7 5 21M13 6.7 19 21" />
      <path d="M8.2 15h7.6" />
    </>
  ),
  // okuma & öğrenme — açık kitap
  'okuma-ogrenme': (
    <>
      <path d="M12 6.5C10 5 6.5 5 4 6v13c2.5-1 6-1 8 .5 2-1.5 5.5-1.5 8-.5V6c-2.5-1-6-1-8 .5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  // strateji & istihbarat — nişangâh
  strateji: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  // yazılım mimarisi — katmanlar
  'yazilim-mimarisi': (
    <>
      <path d="M12 3 21 8l-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
}

export default function ThemeIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" {...P} aria-hidden="true">
      {ICONS[id] || <circle cx="12" cy="12" r="7" />}
    </svg>
  )
}
