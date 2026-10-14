# Aşk yazıları

Her yazı bir klasör: `content/ask/<yazinin-adi>/tr.md` ve isteğe bağlı `en.md`.
Resimler `public/ask/<yazinin-adi>/` altında. `_` ile başlayan klasörler atlanır.

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
