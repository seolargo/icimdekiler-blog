# Külliyat Soyutlama Planı ("Her Şeyin Özeti")

> Amaç: arşivdeki tüm makaleleri tek tek ve bütün olarak soyutlayan bir katman kurmak —
> makale başına yapılandırılmış özet, külliyat düzeyinde sentez ("Harita") ve bunlardan
> türeyen site özellikleri (kavram dizini, ilgili yazılar).
>
> Durum: **planlandı, henüz başlanmadı.** (Temmuz 2026)

## Neden şimdi mümkün?

İki yapı taşı hazır:

1. **Tam metinler çıkarılmış durumda** — `.fulltext-cache.json`, arama indeksi için her
   makalenin temizlenmiş tam metnini tutuyor. PDF'leri yeniden işlemek gerekmiyor.
2. **`@anthropic-ai/sdk` zaten bağımlılık** — özetleme için ek kurulum yok; tek gereken
   bir `ANTHROPIC_API_KEY` ortam değişkeni.

Site tamamen statik kaldığı için çalışma zamanında API çağrısı, backend veya ek maliyet
yok: soyutlamalar build sırasında üretilir, JSON olarak git'e girer, statik dosya olarak
yayınlanır.

## Katman 1 — Yapılandırılmış soyutlama verisi (temel)

`scripts/build-abstracts.js` — `build-search-index.js`'in kardeşi:

- Her makale için Claude API'ye tam metin verilir, sabit şemada soyutlama alınır:

  ```json
  {
    "slug": "...",
    "tez": "Ana iddia, tek cümle.",
    "ozet": "3-4 cümlelik özet.",
    "kavramlar": ["teknik borç", "kaldıraç noktaları", "örtük bilgi"],
    "dayanaklar": ["Simon (sınırlı rasyonalite)", "Meadows"],
    "iliskili": ["diger-makale-slug", "..."]
  }
  ```

- Çıktı `public/abstracts.json`'a yazılır ve **git'e commit edilir**.
- **Artımlı** çalışır (arama indeksiyle aynı desen): yalnızca yeni/değişen makaleler
  özetlenir. Makale değişiminde slug önbellekten düşülür (mevcut değişim akışıyla aynı).
- Maliyet: tek seferlik ~129 makale × birkaç bin token → Haiku ile birkaç dolar
  mertebesi; sonrası makale başına kuruşlar.
- İlk adım: 5-10 makalelik pilot koşu ile şemayı beğeniye göre ayarlamak, sonra tüm
  arşive yaymak.

## Katman 2 — Bu veriden doğan site özellikleri

Aynı `abstracts.json`'dan üç özellik neredeyse bedavaya çıkar:

1. **"Harita" sayfası** (`/harita`) — külliyatın omurga tezleri, altında tema kümeleri ve
   her makalenin tek cümlelik tezi. Omurga (mevcut gözlem):
   - *İyi sistem iz bırakır, kötü sistem tahmin ettirir* (Tahmin Etmek Yerine İz Sürmek,
     Soru Sormak, Geri Bildirim…)
   - *Kaliteyi bireysel kahraman değil sistem üretir* (Geliştirici Hızı, performans
     değerlendirme paradoksu…)
   - *Asıl katman örtük olandır* (Örtük Bilgi, Sezgi, Japon Estetiği'ndeki boşluk…)
2. **Kavram dizini** — kavramdan ilgili makalelere giden indeks sayfası.
3. **Makale sayfasında "ilgili yazılar"** — paylaşılan kavramlardan otomatik türetilir;
   129 makalelik arşivdeki keşfedilebilirlik sorununu da çözer.

## Katman 3 — Sentezin kendisi (meta-makale)

Tüm soyutlamalar hazır olunca Claude'a hepsi verilip külliyat düzeyinde bir **sentez
taslağı** üretilir. Bu taslak otomatik yayınlanmaz: yazarın elinden geçip onun imzasıyla
bir "meta-makale" olarak yayınlanır (arşivin epistemik dürüstlük çizgisine uygun olan bu).
Yeni makaleler biriktikçe taslak yeniden üretilir, yazar revize eder.

## Bonus: Soru-Cevap özelliğiyle ilişki

Ertelenmiş BYOK Soru-Cevap (RAG) özelliğinin temelini bu katman döşer: kavram etiketleri,
açık kalan retrieval seçiminde (BM25 vs embeddings) BM25 tarafını anlamsal düzeye taşıyarak
güçlendirir. Soyutlama katmanı ile Q&A aynı substratı (tam metin + soyutlamalar) paylaşır.

## Uygulama sırası (başlanacağı zaman)

1. `ANTHROPIC_API_KEY` hazırla (yalnızca build sırasında, lokalde kullanılır).
2. `build-abstracts.js` yaz; 5-10 makalelik pilot → şemayı ayarla.
3. Tüm arşive yay; `abstracts.json`'ı commit'le.
4. "İlgili yazılar" bloğu (en düşük maliyet / en yüksek getiri) → sonra `/harita` sayfası
   → sonra kavram dizini.
5. Sentez taslağı üret → yazar revizyonu → meta-makale olarak yayınla.
