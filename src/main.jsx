import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Post from './pages/Post.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter -> GitHub Pages gibi statik sunucularda link paylaşımı sorunsuz çalışır */}
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="post/:slug" element={<Post />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
