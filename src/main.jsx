import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Post from './pages/Post.jsx'
import Muzik from './pages/Muzik.jsx'
import Rehber from './pages/Rehber.jsx'
import Oneriler from './pages/Oneriler.jsx'
import Projeler from './pages/Projeler.jsx'
import Duvarlar from './pages/Duvarlar.jsx'
import KodDuvarlari from './pages/KodDuvarlari.jsx'
import Kavramlar from './pages/Kavramlar.jsx'
import YapayZeka from './pages/YapayZeka.jsx'
import Sor from './pages/Sor.jsx'
import { LanguageProvider } from './i18n.jsx'
import './styles.css'

// Temiz URL'ler (/post/slug) — crawler'ların indeksleyebileceği gerçek yollar.
// basename, vite base'inden türetilir (alt dizinde barındırmayı da destekler).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

// Kaydırma konumunu kendimiz yönetiyoruz (Home listede konumu korur)
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <LanguageProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="muzik" element={<Muzik />} />
            <Route path="rehberler" element={<Rehber />} />
            <Route path="oneriler" element={<Oneriler />} />
            <Route path="projeler" element={<Projeler />} />
            <Route path="duvarlar" element={<Duvarlar />} />
            <Route path="kod-duvarlari" element={<KodDuvarlari />} />
            <Route path="kavramlar" element={<Kavramlar />} />
            <Route path="yapay-zeka" element={<YapayZeka />} />
            <Route path="sor" element={<Sor />} />
            <Route path="post/:slug" element={<Post />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
