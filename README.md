# PDF Blog

React (Vite) tabanlı, backend'siz basit bir blog. PDF'lerini yayınlar, her birine
paylaşılabilir bir link verir.

## Nasıl çalışır?

- PDF dosyalarını `public/pdfs/` klasörüne koyarsın.
- `scripts/generate-manifest.js` bu klasörü tarayıp `public/posts.json` listesini üretir
  (bu `npm run dev` / `npm run build` öncesi **otomatik** çalışır).
- Blog bu listeyi okuyup ana sayfada gösterir; her yazının kendi linki olur.
- `scripts/build-search-index.js` PDF'lerin **tam metnini** çıkarıp `public/search-index.json`
  üretir; ana sayfadaki arama başlık + açıklama + **PDF içeriğinde** arar (artımlı: sadece
  yeni PDF'ler parse edilir). Türkçe/aksan ve LaTeX çıkarım bozulmalarına karşı dayanıklıdır.

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

## SEO

Site tam SEO uyumludur:

- **Temiz URL'ler** (`/post/slug`) — `BrowserRouter` ile crawler'ların indeksleyebileceği gerçek yollar.
- **Prerender:** `npm run build`, `vite build` sonrası her yazı için gerçek statik HTML
  üretir (`dist/post/<slug>/index.html`). Her sayfada JS çalışmadan da görünen içerik +
  sayfa-başına `<title>`, `description`, `canonical`, Open Graph, Twitter Card ve Article
  JSON-LD bulunur.
- **`sitemap.xml`** ve **`robots.txt`** otomatik üretilir.
- Runtime'da rota değiştikçe `useHead` ([src/seo.js](src/seo.js)) meta etiketlerini günceller.

### Yapay zeka keşfedilebilirliği (GEO)

Site, LLM'ler ve AI ajanları tarafından da keşfedilsin diye:

- **`llms.txt`** ([llmstxt.org](https://llmstxt.org) standardı) — tüm makalelerin başlık,
  açıklama ve kalıcı bağlantılarıyla temiz markdown listesi. LLM'lerin siteyi tek dosyadan
  anlaması için.
- **`llms-full.txt`** — tüm makalelerin **tam metni** (PDF'lerden çıkarılıp temizlenmiş).
  LLM'lerin/AI ajanlarının içeriği doğrudan yutması için; `llms.txt` ve `robots.txt` buna işaret eder.
- **`feed.xml`** (RSS 2.0) — AI okuyucular ve ajanların tükettiği makine-okunur akış;
  her sayfanın `<head>`'inde `rel="alternate"` ile bağlanır.
- **`robots.txt`** bilinen AI botlarına (GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
  Applebot-Extended, CCBot, Meta-ExternalAgent, …) **açıkça izin verir** ve `llms.txt` +
  `sitemap.xml` konumlarını bildirir.
- Article JSON-LD ve prerender edilen düz içerik, AI'ların veriyi güvenle çıkarmasını sağlar.

### Build ayarları (ortam değişkenleri)

```bash
# Yayınlanacak tam adres — canonical / sitemap / OG için ŞART
SITE_URL=https://alanadin.com npm run build

# Alt dizinde barındırma (GitHub Pages proje sitesi: user.github.io/repo/)
SITE_URL=https://user.github.io/repo BASE_PATH=/repo/ npm run build
```

`SITE_URL` verilmezse `https://example.com` placeholder kullanılır ve uyarı basılır.

## Yayınlama (paylaşım)

`npm run build` sonrası `dist/` klasörünü herhangi bir statik hosta at. Temiz URL'ler için
her platformun fallback dosyası hazır üretilir:

- **Netlify:** `dist/_redirects` otomatik. Klasörü sürükle-bırak ya da repoyu bağla.
- **Vercel:** kökteki [vercel.json](vercel.json) SPA rewrite'ı sağlar.
- **GitHub Pages:** `dist/404.html` fallback'i yazılır; `BASE_PATH=/repo/` ile build al,
  `dist/` içeriğini `gh-pages` dalına push et.
