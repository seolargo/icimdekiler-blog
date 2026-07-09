import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

export default function Muzik() {
  const { posts, loading, error } = usePosts()
  const { t } = useLang()

  useHead({ title: t('music'), image: '/profile.jpeg' })

  const list = posts.filter((p) => p.tab === 'muzik')

  return (
    <>
      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && (
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
                  <span className="post-title">{post.title}</span>
                  {post.description && (
                    <span className="post-desc">{post.description}</span>
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
