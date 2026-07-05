// Arama için metin "katlama": Türkçe aksanları ve LaTeX PDF çıkarımındaki
// bozuk karakterleri (³=ş, §=ğ, ¸/¨/˘ birleştiriciler) sade ASCII'ye indirger.
// Böylece "başarı" ~ "basari" ~ "ba³ar" aramada yakınlaşır (bozuk PDF'lerde
// bazı 'ı' harfleri tamamen düştüğü için eşleşme en iyi çaba düzeyindedir).
export function fold(s) {
  return (s || '')
    .toLocaleLowerCase('tr')
    .replace(/³/g, 's')
    .replace(/§/g, 'g')
    .replace(/[¸¨˘]/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Sorgudaki her kelime (token) samanlıkta geçiyorsa eşleşir (AND mantığı).
// haystack zaten katlanmış (folded) verilebilir; folded=true ise tekrar katlanmaz.
export function matchesTokens(foldedQuery, haystack, folded = false) {
  if (!foldedQuery) return true
  const hay = folded ? haystack : fold(haystack)
  return foldedQuery.split(' ').every((tok) => hay.includes(tok))
}
