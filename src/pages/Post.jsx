import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead, SITE_NAME } from '../seo.js'

export default function Post() {
  const { slug } = useParams()
  const { posts, loading, error } = usePosts()
  const [copied, setCopied] = useState(false)

  const post = posts.find((p) => p.slug === slug)

  useHead(
    post
      ? {
          title: post.title,
          description: post.description,
          type: 'article',
          image: post.thumb ? `/${post.thumb}` : '/profile.jpeg',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.description || undefined,
            datePublished: post.date || undefined,
            author: { '@type': 'Person', name: SITE_NAME },
            url: window.location.origin + window.location.pathname,
          },
        }
      : {},
  )

  if (loading) return <p className="muted">Yükleniyor…</p>
  if (error) return <p className="error">Hata: {error.message}</p>

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
