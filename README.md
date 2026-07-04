# PDF Blog

React (Vite) tabanlı, backend'siz basit bir blog. PDF'lerini yayınlar, her birine
paylaşılabilir bir link verir.

## Nasıl çalışır?

- PDF dosyalarını `public/pdfs/` klasörüne koyarsın.
- `scripts/generate-manifest.js` bu klasörü tarayıp `public/posts.json` listesini üretir
  (bu `npm run dev` / `npm run build` öncesi **otomatik** çalışır).
- Blog bu listeyi okuyup ana sayfada gösterir; her yazının kendi linki olur.

## Komutlar

```bash
npm install      # ilk kurulum (bir kez)
npm run dev      # geliştirme sunucusu -> http://localhost:5173
npm run build    # dist/ altına production build
npm run preview  # build'i lokal önizle
```

## Yeni PDF ekleme

1. PDF'i `public/pdfs/` içine kopyala (ör. `rapor-2026.pdf`).
2. `npm run dev` çalışıyorsa durdurup tekrar başlat (ya da `npm run manifest`).
3. Otomatik listeye düşer.

### Başlık / açıklama düzenleme

`public/posts.json` dosyasını elle düzenleyebilirsin — `title`, `description`, `date`
alanları senin yazdığın gibi korunur, yeniden tarama bunları silmez:

```json
{
  "slug": "rapor-2026",
  "title": "2026 Yıllık Rapor",
  "date": "2026-07-04",
  "description": "Kısa açıklama burada.",
  "pdf": "rapor-2026.pdf"
}
```

## Yayınlama (paylaşım)

`npm run build` sonrası `dist/` klasörünü herhangi bir statik hosta at:

- **Netlify / Vercel:** klasörü sürükle-bırak ya da GitHub reposunu bağla.
- **GitHub Pages:** `dist/` içeriğini `gh-pages` dalına push et.

Uygulama `HashRouter` + relatif yollar kullanır; alt-dizinde bile yapılandırma
gerektirmeden çalışır ve link paylaşımı bozulmaz.
