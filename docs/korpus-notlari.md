# Korpus Notları

_İçimdekiler arşivi — bütünsel durum ve ikinci-mertebe yol haritası._
_Son güncelleme: 2026-07-29 · 144 açık yazı (156 toplam, 12'si müzik/rehber gizli)._

Bu not, arşiv belli bir eşiği (100+ yazı) geçtikten sonra ortaya çıkan bir gözlemin kaydı:
**144 parça artık bir yığın değil, bir korpus.** Yani üzerinde bütünsel işlem yapılabilir —
indeks, çapraz referans, çelişki taraması, fikir tarihçesi. "Yazacak bir şey kalmadı" hissi
genelde "bu formatta yazacak bir şey kalmadı"nın kılık değiştirmiş hâlidir; asıl açılmamış
damar bu ikinci-mertebe iştir.

Sayısal röntgen `npm run xray` ile üretilir → [`docs/korpus-rontgeni.html`](./korpus-rontgeni.html).

---

## 1. Düşünce parmak izi (ağırlık merkezleri)

Yazıların çoğu, konusu ne olursa olsun aynı beş kavramla düşünüyor. İskelet:

| Kavram | Kaç yazıda |
|---|---|
| Mekanizma (sebep zinciri) | 105 / 144 |
| Gerekçe / niyet | 94 |
| Katman (layer) | 93 |
| Geri besleme / döngü | 80 |
| Doğrulama / sınama / yanlışlanma | 73 |
| Görünürlük / okunaklılık | 45 |
| Kurumsal hafıza / aktarım | 37 |

> Bu bir imza; ama aynı zamanda portredeki dürüst notun sayısal karşılığı:
> aynı aygıt (yapı, katman, sınır, görünürlük) her şeye uygulandıkça, bir süre sonra
> **her şey yapısal bir örüntüye benzemeye başlayabilir.** İzlenmesi gereken risk.

## 2. Yakınsadığı asıl soru

Korpusun yarısı (73–75 yazı) tek bir soruya değiyor ve en yeni + en merkezî yazılar
tam da burada toplanıyor:

> **Bir zihin, bir kurum ya da bir alan — yanıldığını nasıl öğrenir, ve bunun bedeli nedir?**

Omurga metinler: Kurumsal Mükemmellik Rejimleri · Uzun Döngülü Karar Problemleri ·
Sekizinci Soru · Duvarlarla İlerlemek · Bilginin Halka Ulaşması · Gerekçenin Taşınması ·
Anlamın Sınırları. Farklı ölçekler, tek problem — **henüz tek bir metinde adı konmadı.**

## 3. Bağ dokusu

**Çekim merkezleri (en çok bağlanan):** Teknolojik Bilginin Kaybı (6) · Yazılım Mühendisliği
Ne Öğrenebilir (5) · Uzay Bilimlerinden Dersler · Tıp Disiplininden İlkeler · Geometrinin
Ötesi · Kod Tabanı Geometrisi (4'er).

**Kenardakiler (en yalnız):** Regülasyon Netliği · Belirsiz Krizlerde Karar Mimarisi ·
Rengin Söz Dizimi · Mühendislik İletişimi · Çadırın Altındaki Hafıza · Lunar Society.
→ Her biri için karar: **sınır mı (geliştir), fazlalık mı (bırak)?**

**İroni:** "Disiplinler arası izomorfizm" — imza tema, her şeyi bağlaması gereken — kesişim
grafiğinde en yalnız ada; diğer 7 temayla tek yazı paylaşmıyor.

## 4. Kapsam / boşluklar

- Tema haritası gövdenin ~üçte birini örtüyor: **90 yazı kategorisiz.**
- **95 yazının hiç "ilgili yazı" bağı yok.**
- Bunlar kusur değil; **başlamamış ikinci-mertebe iş.** Bağ dokusu zayıf çünkü henüz örülmedi.

---

## İkinci-mertebe yol haritası

Hepsi eldeki 144 metinle yapılabilir — **tek satır yeni paper gerektirmeden.**

1. **Doğrulama omurgasını tek metinde adlandır.** Yarım korpusa yayılmış "yanıldığını nasıl
   öğrenirsin" sorusunu bir çatı yazıda topla. Muhtemelen korpusun asıl kitabı bu.
2. **Çelişki taraması.** Aynı şeye zıt hüküm veren yazı çiftlerini çıkar — çözülmemiş
   gerilimler en verimli yeni yazı konularıdır.
3. **İzomorfizm adasını köprüle.** İmza temayı diğer temalarla kesiştir.
4. **Kenarı karara bağla.** En yalnız yazılar için tek tek geliştir/bırak kararı.
5. **Bağ dokusunu ör.** 95 bağlantısız + 90 kategorisiz yazıya çapraz referans ve tema ver.
6. **(Opsiyonel) Aktarılabilir çıktı.** Yapısı çıkarılmış korpustan kitap / ders / seri.

> Dürüst karşı ağırlık: bunların hiçbiri zorunlu değil. Arşiv hiçbir şey yapılmasa da
> kaybolmuyor, sadece kullanılmıyor. Bir süre hiç yazmamak da meşru bir seçenek —
> boşluk hissi uzun bir üretim döneminin ardından gelen düz zemindir, kendiliğinden geçer.

---

## Araçlar (elle çalıştırılır, build hattının parçası değil)

| Komut | Ne yapar |
|---|---|
| `npm run xray` | Korpus röntgenini yeniden üretir → `docs/korpus-rontgeni.html` |
| `ANTHROPIC_API_KEY=… npm run portrait` | "Bu yazar kim?" portresini korpustan yeniden üretir (TR+EN) |
| `ANTHROPIC_API_KEY=… npm run translate` | Eksik `title_en`/`description_en` alanlarını doldurur |

Özel (private) görsel röntgen artifact'i: claude.ai/code/artifact/6b163b90-b12d-4618-a107-c60a90d2e470
