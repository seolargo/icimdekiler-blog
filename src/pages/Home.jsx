import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang, seriesLabel } from '../i18n.jsx'
import { fold, matchesTokens } from '../search.js'
import { excerpt } from '../excerpt.js'
import ThemeIcon from '../ThemeIcon.jsx'

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

// Görünür sayfa öğelerini üretir: mevcut sayfayı içeren en fazla `windowSize`
// (varsayılan 10) ardışık sayfalık bir pencere gösterir; pencere ile son sayfa
// arasındaki boşluk '…' ile kısaltılır. Örn. 14 sayfada 1. sayfadayken:
// 1 2 3 4 5 6 7 8 9 10 … 14
function pageItems(page, pageCount, windowSize = 10) {
  // Kısaltmaya gerek yok — hepsini göster
  if (pageCount <= windowSize + 1) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  let start = Math.max(1, page - Math.floor(windowSize / 2))
  let end = start + windowSize - 1
  if (end > pageCount) {
    end = pageCount
    start = end - windowSize + 1
  }
  const items = []
  if (start > 1) {
    items.push(1)
    if (start > 2) items.push('…')
  }
  for (let i = start; i <= end; i++) items.push(i)
  if (end < pageCount) {
    if (end < pageCount - 1) items.push('…')
    items.push(pageCount)
  }
  return items
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
      {pageItems(page, pageCount).map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} className="page-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={n}
            className={`page-btn${n === page ? ' is-active' : ''}`}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ),
      )}
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

function FeaturedShelf({ items, t }) {
  if (!items.length) return null
  return (
    <section className="featured">
      <h2 className="section-head">{t('startHere')}</h2>
      <div className="featured-grid">
        {items.map((post) => (
          <Link key={post.slug} to={`/post/${post.slug}`} className="featured-card">
            {post.thumb && (
              <img
                className="featured-thumb"
                src={`${import.meta.env.BASE_URL}${post.thumb}`}
                alt=""
                loading="lazy"
              />
            )}
            <span className="featured-title">{post.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function ThemeGrid({ themes, onPick, t, lang }) {
  if (!themes?.length) return null
  const title = (th) => (lang === 'en' && th.title_en ? th.title_en : th.title)
  const blurb = (th) => (lang === 'en' && th.blurb_en ? th.blurb_en : th.blurb)
  return (
    <section className="themes">
      <h2 className="section-head">{t('themesLabel')}</h2>
      <div className="theme-grid">
        {themes.map((th) => (
          <button
            key={th.id}
            type="button"
            className="theme-card"
            onClick={() => onPick(th.id)}
          >
            <span className="theme-icon"><ThemeIcon id={th.id} /></span>
            <span className="theme-title">{title(th)}</span>
            <span className="theme-blurb">{blurb(th)}</span>
            <span className="theme-more">
              {th.slugs.length} {t('themeCount')} · {t('exploreTheme')}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { posts, loading, error } = usePosts()
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  useHead({ image: '/profile.jpeg' })

  // Liste durumu URL'de tutulur -> geri gelince aynen korunur, paylaşılabilir olur
  const page = Math.max(1, parseInt(searchParams.get('sayfa') || '1', 10) || 1)
  const series = searchParams.get('seri') || null
  const query = searchParams.get('q') || ''
  const tema = searchParams.get('tema') || null

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
  const setTheme = (v) => {
    update({ tema: v || null, sayfa: null, seri: null, q: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Tema haritası + "Buradan başla" seçkisi (public/themes.json) — tembel yüklenir
  const [themes, setThemes] = useState(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}themes.json`)
      .then((r) => r.json())
      .then(setThemes)
      .catch(() => {})
  }, [])

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

  // Liste durumu (sayfa/seri/arama) hatırlanır -> yazıdan "Tüm yazılar" ile
  // dönüşte kaldığın sayfaya gelirsin, baştan başlamazsın
  useEffect(() => {
    sessionStorage.setItem('listSearch:/', location.search)
  }, [location.search])

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

  // Sekmeli yazılar (müzik, rehber) ana "Yazılar" akışında görünmez
  const writings = useMemo(() => posts.filter((p) => !p.tab), [posts])

  // seriler ve adetleri (yazı sırasına göre ilk görülen sırada)
  const seriesList = useMemo(() => {
    const counts = new Map()
    for (const p of writings) {
      if (p.series) counts.set(p.series, (counts.get(p.series) || 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [writings])

  const bySlug = useMemo(() => new Map(writings.map((p) => [p.slug, p])), [writings])
  const themeObj = tema ? themes?.themes.find((th) => th.id === tema) : null
  const featuredPosts = useMemo(
    () => (themes ? themes.featured.map((s) => bySlug.get(s)).filter(Boolean) : []),
    [themes, bySlug],
  )

  const [sort, setSort] = useState('yeni')

  // Duvarlar aramaya dahil: katalog yalnızca arama yapılınca çekilir
  const [walls, setWalls] = useState(null)
  useEffect(() => {
    if (!query.trim() || walls) return
    fetch(`${import.meta.env.BASE_URL}duvarlar.json`)
      .then((r) => r.json())
      .then((d) => setWalls(d.walls || []))
      .catch(() => setWalls([]))
  }, [query, walls])

  const wallHits = useMemo(() => {
    const fq = fold(query.trim())
    if (!fq || !walls) return []
    return walls
      .filter((w) =>
        matchesTokens(
          fq,
          fold(`${w.id} ${w.title} ${w.kural} ${w.kirilir} ${w.neden} ${w.kaynak.join(' ')}`),
          true,
        ),
      )
      .slice(0, 4)
  }, [walls, query])

  const filtered = useMemo(() => {
    // Tema seçiliyken küratör sırasını koru
    if (themeObj) return themeObj.slugs.map((s) => bySlug.get(s)).filter(Boolean)
    const fq = fold(query.trim())
    return writings.filter((p) => {
      if (series && p.series !== series) return false
      if (!fq) return true
      const hay =
        fold(p.belge || '') + ' ' + fold(p.title) + ' ' + fold(p.description) + ' ' + (index?.get(p.slug) || '')
      return matchesTokens(fq, hay, true)
    })
  }, [writings, query, series, index, themeObj, bySlug])

  // Kriz sıralaması: puana göre azalan; eşitlikte mevcut (yeni önce) sıra korunur
  const ordered = useMemo(() => {
    if (sort !== 'oncelik') return filtered
    return filtered
      .map((p, i) => [p, i])
      .sort((a, b) => (b[0].priority || 0) - (a[0].priority || 0) || a[1] - b[1])
      .map(([p]) => p)
  }, [filtered, sort])

  // "Buradan başla" + tema ızgarası yalnızca temiz açılış görünümünde
  const showLanding = !query && !series && !tema && page === 1

  const pageCount = Math.ceil(ordered.length / PER_PAGE)
  const current = Math.min(page, pageCount || 1)
  const visible = ordered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

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
          {showLanding && themes && (
            <>
              <FeaturedShelf items={featuredPosts} t={t} />
              <ThemeGrid themes={themes.themes} onPick={setTheme} t={t} lang={lang} />
              <h2 className="section-head all-head">{t('writings')}</h2>
            </>
          )}

          {themeObj && (
            <div className="theme-head">
              <button type="button" className="back-link" onClick={() => setTheme(null)}>
                {t('allPosts')}
              </button>
              <h2 className="section-head">
                {lang === 'en' && themeObj.title_en ? themeObj.title_en : themeObj.title}
              </h2>
              <p className="muted theme-head-blurb">
                {lang === 'en' && themeObj.blurb_en ? themeObj.blurb_en : themeObj.blurb}
              </p>
            </div>
          )}

          {!themeObj && (
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
                  {seriesLabel(name, lang)} <span className="chip-count">{count}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {wallHits.length > 0 && (
            <div className="wall-hits">
              <h3 className="wall-hits-head">{t('wallsFound')}</h3>
              <ul>
                {wallHits.map((w) => (
                  <li key={w.id}>
                    <Link to={`/duvarlar?q=${encodeURIComponent(query.trim())}`}>
                      <span className="wall-hits-id">{w.id}</span>
                      <span className="wall-hits-title">{w.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ordered.length > 0 && (
            <div className="list-controls">
              {(query || series) && (
                <p className="muted result-count">
                  {ordered.length} {t('results')}
                </p>
              )}
              <div className="sort-switch" role="group" aria-label={t('sortLabel')}>
                <button
                  type="button"
                  className={`sort-btn${sort === 'yeni' ? ' is-active' : ''}`}
                  onClick={() => { setSort('yeni'); goTo(1) }}
                >
                  {t('sortNewest')}
                </button>
                <button
                  type="button"
                  className={`sort-btn${sort === 'oncelik' ? ' is-active' : ''}`}
                  onClick={() => { setSort('oncelik'); goTo(1) }}
                >
                  {t('sortPriority')}
                </button>
              </div>
            </div>
          )}

          {ordered.length === 0 ? (
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
                        <span className="post-title">
                          {lang === 'en' && post.title_en ? post.title_en : post.title}
                        </span>
                        {(post.belge || post.series || post.pages > 0 || post.priority) && (
                          <span className="post-series">
                            {post.priority ? (
                              <span
                                className={`post-priority p${post.priority}`}
                                title={t('priorityHint')}
                              >
                                {post.priority}
                              </span>
                            ) : null}
                            {[
                              post.belge,
                              seriesLabel(post.series, lang),
                              post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                        {post.description && (
                          <span className="post-desc">
                            {excerpt(
                              lang === 'en' && post.description_en
                                ? post.description_en
                                : post.description
                            )}
                          </span>
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
