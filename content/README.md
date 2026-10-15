# Deneme bölümleri (Aşk, İnsan)

Her yazı bir klasör: `content/<bolum>/<yazinin-adi>/tr.md` (bölüm: `ask` ya da `insan`) ve isteğe bağlı `en.md`.
Resimler `public/<bolum>/<yazinin-adi>/` altında. `_` ile başlayan klasörler atlanır.

```
---
baslik: Yazının başlığı
tarih: 2026-10-14
kapak: kapak.jpg
ozet: İsteğe bağlı; yoksa ilk paragraftan üretilir
---
Paragraflar boş satırla ayrılır. Paragraf içindeki tek satır sonu korunur.

## Ara başlık

![Resim altı yazısı](resim.jpg)

> Alıntı

---

*italik*, **kalın**, [bağlantı](https://...)
```

`en.md` yalnızca `baslik` (ve isteğe bağlı `ozet`) taşır; tarih ve kapak `tr.md`'den gelir.
Derleme: `npm run ask` (predev/prebuild'de otomatik).

## Aşk sözlüğü

Kavramlar sayfasındaki "Aşk sözlüğü" kipi `content/ask-kavramlar.json` listesinden gelir.
Liste elle seçilir (soyut kavramlar + kökleri); sayılar, yazılar, biçimler ve komşular
`scripts/build-ask-kavramlar.js` ile hesaplanır. Yeni Aşk yazısı eklenince o yazının getirdiği
yeni soyut kavramları listeye ekle; hiç geçmeyen kavramı betik çıktıda bildirir.
