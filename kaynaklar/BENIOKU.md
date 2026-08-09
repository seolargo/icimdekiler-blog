# Kaynaklar

Serbestçe yeniden dağıtılabilen üçüncü taraf başvuru belgeleri. **Depoya girer,
siteye çıkmaz.**

## Neden `public/` değil

`public/` içindeki her şey `vite build` ile `dist/`e kopyalanır ve yayına çıkar.
Bu klasör `public/` dışında olduğu için derlemeye hiç girmez: dosya GitHub'da
durur, sitede bir adresi olmaz. Öneriler sekmesinde yalnızca **adı** listelenir.

## Neden `yerel/` değil

`yerel/` gitignore'da; oradaki belgeler depoya da girmez. Ayrım telif:

| Klasör | Ne konur | Depoda | Sitede |
|---|---|---|---|
| `kaynaklar/` | serbestçe dağıtılabilen yayınlar (kamu malı, açık lisans) | ✅ | ❌ |
| `yerel/` | telifli / dağıtılamayan yayınlar, dışa kapalı tutulacak kendi belgelerin | ❌ | ❌ |
| `public/pdfs/` | korpusa giren kendi makalelerin | ✅ | ✅ |

Bir belgeyi buraya koymadan önce lisansını doğrula. "İnternette bulunuyor"
yeniden dağıtma hakkı vermez.

## İçindekiler

- `NASA_Systems_Engineering_Handbook_SP-2007-6105_Rev1.pdf` — NASA Systems
  Engineering Handbook, Revision 1 (2007), 361 sayfa. NASA STI Program yayını;
  ABD federal kurum eseri olduğu için ABD'de kamu malı (17 U.S.C. §105).

## Yeni belge eklemek

1. PDF'i buraya koy.
2. `public/recommendations.json`'a **yalnızca ad** olan bir kayıt ekle:
   `{ "name": "..." }` — `url` alanı yazma, o zaman bağlantı değil düz metin
   olarak basılır.
3. Derlemede `dist/` içine sızmadığını doğrula.
