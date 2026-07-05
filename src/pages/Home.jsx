import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'

const PER_PAGE = 10

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function Intro() {
  return (
    <section className="intro">
      <p>
        Applying a cognitive evolution framework in software engineering —
        spanning similarity recognition, clustering, visual, abstraction,
        modular and generalized design, to evolutionary, intent-oriented, and
        reflective–adaptive system thinking with self-improving architectures.
      </p>
      <p>
        Focused on building systems that learn, evolve, and align with human
        intent and needs.
      </p>
      <p className="intro-quote">
        Every problem must be solved in design before it reaches engineering —
        clarity scales better than code.
      </p>
    </section>
  )
}

function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  return (
    <nav className="pagination" aria-label="Sayfalar">
      <button
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Önceki"
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
        aria-label="Sonraki"
      >
        ›
      </button>
    </nav>
  )
}

export default function Home() {
  const { posts, loading, error } = usePosts()
  const [page, setPage] = useState(1)

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

      {loading && <p className="muted">Yükleniyor…</p>}
      {error && <p className="error">Hata: {error.message}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="empty">
          <p>Henüz PDF yok.</p>
          <p className="muted">
            <code>public/pdfs/</code> klasörüne bir PDF ekleyip sunucuyu yeniden
            başlat — otomatik listeye düşer.
          </p>
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
                    <time className="post-date">{formatDate(post.date)}</time>
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
