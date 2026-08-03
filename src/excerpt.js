// Liste kartlarındaki açıklamaları kelime sayısıyla kısaltır. Tam açıklama yazı
// sayfasında (post-lead) olduğu gibi durur; kısaltma yalnızca kart görünümleri
// içindir. React tarafı ile prerender aynı fonksiyonu kullanır, böylece statik
// HTML ile istemcide görünen metin birebir aynı olur.
export const CARD_WORDS = 35
export const RELATED_WORDS = 22

export function excerpt(text, words = CARD_WORDS) {
  const s = (text || '').trim()
  if (!s) return ''
  const parts = s.split(/\s+/)
  if (parts.length <= words) return s
  return (
    parts
      .slice(0, words)
      .join(' ')
      // yarım kalan cümlenin sonundaki bağlayıcı noktalamayı at
      .replace(/[\s,;:.—–-]+$/u, '')
      .replace(/[(“"«]$/u, '') + '…'
  )
}
