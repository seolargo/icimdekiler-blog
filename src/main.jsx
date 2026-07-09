import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Post from './pages/Post.jsx'
import Muzik from './pages/Muzik.jsx'
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
            <Route path="post/:slug" element={<Post />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
