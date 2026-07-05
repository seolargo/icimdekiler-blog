import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

const PER_PAGE = 10

const trLower = (s) => (s || '').toLocaleLowerCase('tr')

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
  const [query, setQuery] = useState('')
  const [series, setSeries] = useState(null) // null = tümü

  useHead({ image: '/profile.jpeg' })

  // seriler ve adetleri (yazı sırasına göre ilk görülen sırada)
  const seriesList = useMemo(() => {
    const counts = new Map()
    for (const p of posts) {
      if (p.series) counts.set(p.series, (counts.get(p.series) || 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [posts])

  const filtered = useMemo(() => {
    const q = trLower(query.trim())
    return posts.filter((p) => {
      if (series && p.series !== series) return false
      if (!q) return true
      return trLower(p.title).includes(q) || trLower(p.description).includes(q)
    })
  }, [posts, query, series])

  const pageCount = Math.ceil(filtered.length / PER_PAGE)
  const current = Math.min(page, pageCount || 1)
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const goTo = (n) => {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // filtre/arama değişince ilk sayfaya dön
  const resetTo = (fn) => (val) => {
    fn(val)
    setPage(1)
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
          <div className="discover">
            <input
              type="search"
              className="search-input"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => resetTo(setQuery)(e.target.value)}
              aria-label={t('searchPlaceholder')}
            />
            <div className="series-chips" role="group" aria-label="Seriler">
              <button
                type="button"
                className={`chip${series === null ? ' is-active' : ''}`}
                onClick={() => resetTo(setSeries)(null)}
              >
                {t('all')} <span className="chip-count">{posts.length}</span>
              </button>
              {seriesList.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  className={`chip${series === name ? ' is-active' : ''}`}
                  onClick={() => resetTo(setSeries)(series === name ? null : name)}
                >
                  {name} <span className="chip-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="muted no-results">{t('noResults')}</p>
          ) : (
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
                        {post.series && (
                          <span className="post-series">{post.series}</span>
                        )}
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
      )}
    </>
  )
}
