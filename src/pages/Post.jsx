import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'

export default function Post() {
  const { slug } = useParams()
  const { posts, loading, error } = usePosts()
  const [copied, setCopied] = useState(false)

  if (loading) return <p className="muted">Yükleniyor…</p>
  if (error) return <p className="error">Hata: {error.message}</p>

  const post = posts.find((p) => p.slug === slug)
  if (!post) {
    return (
      <div className="empty">
        <p>Bu yazı bulunamadı.</p>
        <Link to="/" className="back-link">← Tüm yazılar</Link>
      </div>
    )
  }

  const pdfUrl = `${import.meta.env.BASE_URL}pdfs/${post.pdf}`

  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <article className="post">
      <Link to="/" className="back-link">← Tüm yazılar</Link>

      <div className="post-head">
        <div>
          <h1 className="post-heading">{post.title}</h1>
          {post.description && <p className="post-lead">{post.description}</p>}
        </div>
      </div>

      <div className="post-actions">
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn">
          Yeni sekmede aç
        </a>
        <a href={pdfUrl} download className="btn">
          İndir
        </a>
        <button type="button" onClick={share} className="btn">
          {copied ? 'Bağlantı kopyalandı ✓' : 'Paylaş'}
        </button>
      </div>

      <div className="pdf-frame">
        <iframe title={post.title} src={pdfUrl} />
      </div>
    </article>
  )
}
