import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'
import { fold, matchesTokens } from '../search.js'

const PER_PAGE = 10

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
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  useHead({ image: '/profile.jpeg' })

  // Liste durumu URL'de tutulur -> geri gelince aynen korunur, paylaşılabilir olur
  const page = Math.max(1, parseInt(searchParams.get('sayfa') || '1', 10) || 1)
  const series = searchParams.get('seri') || null
  const query = searchParams.get('q') || ''

  const update = (patch) => {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next, { replace: true })
  }

  const setQuery = (v) => update({ q: v || null, sayfa: null })
  const setSeries = (v) => update({ seri: v || null, sayfa: null })

  // Tam metin arama indeksi (PDF içerikleri) — tembel yüklenir
  const [index, setIndex] = useState(null)
  const indexReq = useRef(null)
  const loadIndex = () => {
    if (index || indexReq.current) return
    indexReq.current = fetch(`${import.meta.env.BASE_URL}search-index.json`)
      .then((r) => r.json())
      .then((arr) => setIndex(new Map(arr.map((e) => [e.slug, e.body]))))
      .catch(() => {})
  }
  // Paylaşılan linkte hazır bir sorgu varsa indeksi hemen yükle
  useEffect(() => {
    if (query) loadIndex()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const goTo = (n) => {
    update({ sayfa: n > 1 ? String(n) : null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Kaydırma konumunu URL başına kaydet; geri gelişte geri yükle
  useEffect(() => {
    const key = 'scroll:' + location.pathname + location.search
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() =>
        sessionStorage.setItem(key, String(window.scrollY)),
      )
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (loading) return
    const key = 'scroll:' + location.pathname + location.search
    const y = sessionStorage.getItem(key)
    if (y != null) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(y, 10)))
    }
  }, [loading, location.pathname, location.search])

  // Müzik sekmesindeki yazılar ana "Yazılar" akışında görünmez
  const writings = useMemo(() => posts.filter((p) => p.tab !== 'muzik'), [posts])

  // seriler ve adetleri (yazı sırasına göre ilk görülen sırada)
  const seriesList = useMemo(() => {
    const counts = new Map()
    for (const p of writings) {
      if (p.series) counts.set(p.series, (counts.get(p.series) || 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [writings])

  const filtered = useMemo(() => {
    const fq = fold(query.trim())
    return writings.filter((p) => {
      if (series && p.series !== series) return false
      if (!fq) return true
      const hay =
        fold(p.title) + ' ' + fold(p.description) + ' ' + (index?.get(p.slug) || '')
      return matchesTokens(fq, hay, true)
    })
  }, [writings, query, series, index])

  const pageCount = Math.ceil(filtered.length / PER_PAGE)
  const current = Math.min(page, pageCount || 1)
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

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
              onFocus={loadIndex}
              onChange={(e) => {
                loadIndex()
                setQuery(e.target.value)
              }}
              aria-label={t('searchPlaceholder')}
            />
            <div className="series-chips" role="group" aria-label="Seriler">
              <button
                type="button"
                className={`chip${series === null ? ' is-active' : ''}`}
                onClick={() => setSeries(null)}
              >
                {t('all')} <span className="chip-count">{writings.length}</span>
              </button>
              {seriesList.map(({ name, count }) => (
                <button
                  key={name}
                  type="button"
                  className={`chip${series === name ? ' is-active' : ''}`}
                  onClick={() => setSeries(series === name ? null : name)}
                >
                  {name} <span className="chip-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {(query || series) && filtered.length > 0 && (
            <p className="muted result-count">
              {filtered.length} {t('results')}
            </p>
          )}

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
                        {(post.series || post.pages > 0) && (
                          <span className="post-series">
                            {[post.series, post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                        {post.description && (
                          <span className="post-desc">{post.description}</span>
                        )}
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
