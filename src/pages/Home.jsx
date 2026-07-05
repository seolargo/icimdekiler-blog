import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

const PER_PAGE = 10

function formatDate(iso, locale) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function Intro() {
  const { t } = useLang()
  return (
    <section className="intro">
      <p>{t('intro1')}</p>
      <p>{t('intro2')}</p>
      <p className="intro-quote">{t('introQuote')}</p>
    </section>
  )
}

function Pagination({ page, pageCount, onChange }) {
  const { t } = useLang()
  if (pageCount <= 1) return null
  return (
    <nav className="pagination" aria-label="Sayfalar">
      <button
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label={t('prev')}
      >
        ‹
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          className={`page-btn${n === page ? ' is-active' : ''}`}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}
      <button
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label={t('next')}
      >
        ›
      </button>
    </nav>
  )
}

export default function Home() {
  const { posts, loading, error } = usePosts()
  const { t, lang } = useLang()
  const [page, setPage] = useState(1)

  useHead({ image: '/profile.jpeg' })

  const pageCount = Math.ceil(posts.length / PER_PAGE)
  const current = Math.min(page, pageCount || 1)
  const visible = posts.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const goTo = (n) => {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Intro />

      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="empty">
          <p>{t('emptyTitle')}</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <>
          <ul className="post-list">
            {visible.map((post) => (
              <li key={post.slug} className="post-item">
                <Link to={`/post/${post.slug}`} className="post-link">
                  {post.thumb && (
                    <img
                      className="post-thumb"
                      src={`${import.meta.env.BASE_URL}${post.thumb}`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="post-body">
                    <span className="post-title">{post.title}</span>
                    {post.description && (
                      <span className="post-desc">{post.description}</span>
                    )}
                    <time className="post-date">{formatDate(post.date, lang)}</time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={current} pageCount={pageCount} onChange={goTo} />
        </>
      )}
    </>
  )
}
