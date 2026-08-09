# İçimdekiler — çalışma notu

Bu dosya her oturumda otomatik okunur. Kısa tutulacak; şişerse okunmaz olur.

## Bu proje ne

Ömer Faruk Yavuz'un yazdığı makalelerin arşivi değil, **korpusu**. 167 kayıt
(155'i açık, 12'si gizli müzik/rehber). Üstünde ikinci mertebeden bir katman
var: korpustan türetilmiş **34 duvar** — taşınabilir kurallar, her biri
"X'te geçerli / Y'de kırılır" formunda. 12'sinin dışarıdan sınama kaydı var.

Canlı: https://icimdekiler-blog.vercel.app · Vercel projesi `icimdekiler-blog`
(GitHub entegrasyonu yok, deploy CLI ile).

## Nasıl çalışılır

Her değişiklikten sonra **sormadan**: commit → `git push` →
`npx vercel deploy --prod --yes`. Sonra canlıyı curl ile doğrula.

Derleme her zaman `SITE_URL` ile:
`SITE_URL=https://icimdekiler-blog.vercel.app npm run build`

**Yeni PDF eklemek:**
1. `public/pdfs/` içine kopyala (taşıma — kaynağı yerinde bırak)
2. `npm run manifest && npm run search-index`
3. Başlığı ve açıklamayı **elle** yaz (TR + EN) — otomatik başlık bozuk çıkıyor
4. `related` ver ve **çift yönlü** bağla
5. `priority` ver: kriz anında acele referans arayan biri için 1–10.
   10 = doğrudan uygulanabilir adım/denetim listesi. 1 = bağlam/tarih.

**Yerel belge eklemek:** `yerel/pdfs/` içine kopyala → `yerel/posts.local.json`'a
kayıt ekle → `npm run yerel-metin`. Korpusa girmez, aramada çıkmaz, yayına çıkmaz;
ama düz metni `yerel/texts/` altında olduğu için sorulara cevap verirken kullanılır.

## Kimlikler

Belgeler `BELGE-001`…, duvarlar `DUVAR-01`… Eklenme sırasına göre bir kez
atanır, **bir daha değişmez** — silinen numara boş kalır, yeni kayıt sona
eklenir. Sesle konuşurken slug yerine bunu kullan.

## Yapı

| Yer | Ne |
|---|---|
| `public/posts.json` | manifest: belge, title, description (TR/EN), related, priority |
| `public/duvarlar.json` + `docs/duvarlar.md` | kural kataloğu — **ikisi eşit tutulacak** |
| `public/texts/*.txt` | düz metin (arama + llms.txt buradan) |
| `yerel/` | gitignore'da, dışarı çıkmayan belgeler, yalnızca localhost |
| `yerel/texts/*.txt` | yerel belgelerin düz metni — **soru sorulduğunda buraya da bak** |
| `scripts/duvar.js` | `npm run duvar <konu>` / `--diff` — duvarları karar anında önüne getirir |

## Anlatım

Önce 3–5 satırlık düz özet ver, ayrıntıyı ancak istenirse aç. Uzun mimari
metinleri okunmadan geçiliyor. Rakam varsa rakamı ver, türetmeyi anlatma.

## Duvar yazma kuralı

Bir maddenin `kırılır` alanı yoksa o şey duvar değil, etikettir — kataloğa
girmez. Duvar dışarıdan bir şeye çarptığında `sinama` alanına yazılır:
tarih, sonuç (desteklendi / daraltıldı / kırıldı), ne bulunduğu, kaynak.

---

## Dersler

Aynı format: **ders — ne zaman kırılır.** Kırılma koşulu yoksa yazma.

- **Bir kaynağı hafızadan tarif etme, açıp oku.** Bu oturumda sekiz blog
  hafızadan tarif edildi, en az ikisi yanlış çıktı.
  *Kırılır:* kendi deponda ya da diskindeki dosyaysa — orada okumak zaten
  varsayılan.

- **Arayüzde gizlemek dosyayı gizlemez.** `public/` içindeki her şey derlemeye
  ve yayına çıkar; depo da GitHub'da açık. Linki kaldırmak yetmez.
  *Kırılır:* dosya `public/` dışında **ve** gitignore'daysa — o zaman gerçekten
  çıkmıyor.

- **"Bu ölçekte gerekmez" derken hangi ölçek olduğunu söyle.** 34 duvar tek
  isteme sığıyor, retrieval gereksiz. 155 yazının tam metni 1,14 milyon token,
  sığmıyor — orada retrieval zorunlu. Aynı soru, iki farklı cevap.
  *Kırılır:* —

- **Yeni araç önermeden önce kurulu olanı kontrol et.** Claude Code'da dikte
  zaten varmış; macOS diktesi ise hiç açılmamış.
  *Kırılır:* kullanıcı o aracı zaten kullandığını söylüyorsa.
