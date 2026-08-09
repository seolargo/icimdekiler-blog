// LaTeX/PDF çıkarımındaki Türkçe karakter bozulmalarını okunabilir hale getirir.
// (Bazı 'ı/İ' harfleri çıkarımda tamamen düştüğü için en iyi çaba düzeyindedir.)
// Tek kaynak: hem public korpus (build-search-index.js) hem yerel kütüphane
// (build-yerel-texts.js) bunu kullanır — iki kopya tutulmaz.
export function clean(s) {
  return (s || '')
    .replace(/¸\s?c/g, 'ç').replace(/¸\s?C/g, 'Ç')
    .replace(/¸\s?s/g, 'ş').replace(/¸\s?S/g, 'Ş')
    .replace(/¨\s?u/g, 'ü').replace(/¨\s?U/g, 'Ü')
    .replace(/¨\s?o/g, 'ö').replace(/¨\s?O/g, 'Ö')
    .replace(/¨\s?ı/g, 'i').replace(/¨\s?i/g, 'i')
    .replace(/˘\s?g/g, 'ğ').replace(/˘\s?G/g, 'Ğ')
    .replace(/ˆ\s?a/g, 'â').replace(/ˆ\s?ı/g, 'ı')
    .replace(/³/g, 'ş')
    .replace(/§/g, 'ğ')
    .replace(/[¸¨˘ˆ]/g, '') // kalan birleştiriciler
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
