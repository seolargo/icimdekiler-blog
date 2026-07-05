import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead, SITE_NAME } from '../seo.js'
import { useLang } from '../i18n.jsx'

export default function Post() {
  const { slug } = useParams()
  const { posts, loading, error } = usePosts()
  const { t } = useLang()
  const [copied, setCopied] = useState(false)

  // Yeni bir yazıya girildiğinde en üstten başla
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

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

  if (loading) return <p className="muted">{t('loading')}</p>
  if (error) return <p className="error">{t('error')}: {error.message}</p>

  if (!post) {
    return (
      <div className="empty">
        <p>{t('notFound')}</p>
        <Link to="/" className="back-link">{t('allPosts')}</Link>
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
      <Link to="/" className="back-link">{t('allPosts')}</Link>

      <div className="post-head">
        <div>
          <h1 className="post-heading">{post.title}</h1>
          {post.description && <p className="post-lead">{post.description}</p>}
        </div>
      </div>

      {post.note && <p className="post-note">{post.note}</p>}

      <div className="post-actions">
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn">
          {t('openNewTab')}
        </a>
        <a href={pdfUrl} download className="btn">
          {t('download')}
        </a>
        <button type="button" onClick={share} className="btn">
          {copied ? t('copied') : t('share')}
        </button>
      </div>

      <div className="pdf-frame">
        <iframe title={post.title} src={pdfUrl} />
      </div>
    </article>
  )
}
