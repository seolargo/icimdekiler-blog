import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

export default function Rehber() {
  const { posts, loading, error } = usePosts()
  const { t } = useLang()

  useHead({ title: t('guides'), image: '/profile.jpeg' })

  // Rehber paperları şimdilik dışa kapalı: yalnızca başlık listelenir,
  // tıklanamaz/önizlenemez, içi açılamaz.
  const list = posts.filter((p) => p.tab === 'rehber')

  return (
    <>
      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && (
        <ul className="post-list">
          {list.map((post) => (
            <li key={post.slug} className="post-item hidden-item">
              <span className="post-title">{post.title}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
