import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang, seriesLabel } from '../i18n.jsx'
import { excerpt } from '../excerpt.js'

// Aşk sekmesi: manifestte `bolum: "ask"` olan yazılar. Gizli sekmelerin (müzik,
// rehber) aksine bunlar açık yazılardır; yalnızca Yazılar listesi yerine burada durur.
export default function Ask() {
  const { posts, loading, error } = usePosts()
  const { t, lang } = useLang()

  useHead({ title: t('love'), image: '/profile.jpeg' })

  const list = posts.filter((p) => p.bolum === 'ask' && !p.tab)

  return (
    <>
      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && list.length === 0 && <p className="muted">{t('loveEmpty')}</p>}

      {!loading && !error && list.length > 0 && (
        <ul className="post-list">
          {list.map((post) => (
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
                  <span className="post-series">
                    {[
                      post.belge,
                      seriesLabel(post.series, lang),
                      post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {post.description && (
                    <span className="post-desc">
                      {excerpt(
                        lang === 'en' && post.description_en ? post.description_en : post.description
                      )}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
