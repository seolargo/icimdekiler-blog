import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead, SITE_NAME } from '../seo.js'
import { useLang, seriesLabel } from '../i18n.jsx'

export default function Post() {
  const { slug } = useParams()
  const { posts, loading, error } = usePosts()
  const { t, lang } = useLang()
  const [copied, setCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)
  const [citeCopied, setCiteCopied] = useState(false)

  // Yeni bir yazıya girildiğinde en üstten başla
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  const found = posts.find((p) => p.slug === slug)
  // Müzik/rehber paperları şimdilik dışa kapalı: içi açılamaz (bulunamadı gibi davran)
  const post = found && found.tab ? undefined : found
  // EN modda çeviri varsa göster, yoksa TR'ye düş
  const dTitle = (p) => (p ? (lang === 'en' && p.title_en ? p.title_en : p.title) : '')
  const dDesc = (p) => (p ? (lang === 'en' && p.description_en ? p.description_en : p.description) : '')
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
          title: dTitle(post),
          description: dDesc(post),
          type: 'article',
          image: post.thumb ? `/${post.thumb}` : '/profile.jpeg',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: dTitle(post),
            description: dDesc(post) || undefined,
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
  const textUrl = `${import.meta.env.BASE_URL}texts/${post.slug}.txt`

  // Atıf bilgileri
  const citeUrl = window.location.origin + window.location.pathname
  const citeYear = (post.date || '').slice(0, 4) || String(new Date().getFullYear())
  const citeText = `${SITE_NAME}. "${dTitle(post)}." İçimdekiler, ${citeYear}. ${citeUrl}`
  const citeKey = 'oyavuz' + citeYear + post.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
  const citeBib =
    `@misc{${citeKey},\n` +
    `  author = {${SITE_NAME}},\n` +
    `  title  = {${dTitle(post)}},\n` +
    `  year   = {${citeYear}},\n` +
    `  howpublished = {İçimdekiler},\n` +
    `  url    = {${citeUrl}}\n` +
    `}`
  function copyCite(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCiteCopied(true)
      setTimeout(() => setCiteCopied(false), 2000)
    })
  }

  function copyText() {
    fetch(textUrl)
      .then((r) => r.text())
      .then((text) => navigator.clipboard.writeText(text))
      .then(() => {
        setTextCopied(true)
        setTimeout(() => setTextCopied(false), 2000)
      })
  }

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
          <h1 className="post-heading">{dTitle(post)}</h1>
          {(post.series || post.pages > 0) && (
            <p className="post-meta">
              {[seriesLabel(post.series, lang), post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {post.description && <p className="post-lead">{dDesc(post)}</p>}
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
        <button type="button" onClick={copyText} className="btn">
          {textCopied ? t('textCopied') : t('copyText')}
        </button>
        <a href={textUrl} download={`${post.slug}.txt`} className="btn">
          {t('downloadText')}
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
                  <span className="post-related-name">{dTitle(rp)}</span>
                  {rp.description && (
                    <span className="post-related-desc">{dDesc(rp)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="cite">
        <h2 className="cite-title">{t('citeTitle')}</h2>
        <p className="cite-text">{citeText}</p>
        <div className="cite-actions">
          <button type="button" className="btn" onClick={() => copyCite(citeText)}>
            {citeCopied ? t('citeCopied') : t('citeCopy')}
          </button>
          <button type="button" className="btn" onClick={() => copyCite(citeBib)}>
            {t('citeBibtex')}
          </button>
        </div>
      </section>
    </article>
  )
}
