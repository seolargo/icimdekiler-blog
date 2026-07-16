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
  const curatedRelated = (post?.related || [])
    .map((s) => posts.find((p) => p.slug === s))
    .filter(Boolean)
  // Elle küratörlü ilişki yoksa aynı seriden diğer yazılara düş
  const relatedPosts = curatedRelated.length
    ? curatedRelated
    : post?.series
      ? posts.filter((p) => p.series === post.series && p.slug !== post.slug).slice(0, 8)
      : []

  // Listeden gelindiyse kaldığı sayfaya/filtreye geri döndür (Home kaydeder)
  const listSearch = sessionStorage.getItem('listSearch:/') || ''
  const backTo =
    post?.tab === 'muzik'
      ? '/muzik'
      : post?.tab === 'rehber'
        ? '/rehberler'
        : { pathname: '/', search: listSearch }
  const backLabel =
    post?.tab === 'muzik'
      ? `← ${t('music')}`
      : post?.tab === 'rehber'
        ? `← ${t('guides')}`
        : t('allPosts')

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
        <Link to={backTo} className="back-link">{backLabel}</Link>
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
      <Link to={backTo} className="back-link">{backLabel}</Link>

      <div className="post-head">
        <div>
          <h1 className="post-heading">{post.title}</h1>
          {(post.series || post.pages > 0) && (
            <p className="post-meta">
              {[post.series, post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
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

      {relatedPosts.length > 0 && (
        <div className="post-related">
          <h2 className="post-related-title">{t('relatedPosts')}</h2>
          <ul className="post-related-list">
            {relatedPosts.map((rp) => (
              <li key={rp.slug} className="post-related-item">
                <Link to={`/post/${rp.slug}`}>
                  {rp.thumb && (
                    <img
                      className="post-related-thumb"
                      src={`${import.meta.env.BASE_URL}${rp.thumb}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span className="post-related-name">{rp.title}</span>
                  <span className="post-related-slug">{rp.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
