import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useAsk, useAskFonts, pick, formatDate } from '../useAsk.js'
import { useHead } from '../seo.js'
import { useLang, seriesLabel } from '../i18n.jsx'
import { excerpt } from '../excerpt.js'

// Aşk sekmesi: düz metin + resim yazıları (ask.json) ve "Aşk'a konan" PDF
// belgeleri (manifestte bolum: "ask"). Görünüş yalnızca bu bölüme özgüdür.
export default function Ask() {
  const { posts, loading: pLoading, error: pError } = usePosts()
  const { items, loading: aLoading, error: aError } = useAsk()
  const { t, lang } = useLang()
  useAskFonts()
  useHead({ title: t('love'), image: '/profile.jpeg' })

  const loading = pLoading || aLoading
  const error = pError || aError
  const papers = posts.filter((p) => p.bolum === 'ask' && !p.tab)
  const base = import.meta.env.BASE_URL

  return (
    <div className="ask">
      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && items.length === 0 && papers.length === 0 && (
        <p className="muted">{t('loveEmpty')}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="ask-list">
          {items.map((item) => {
            const v = pick(item, lang)
            return (
              <li key={item.slug}>
                <Link to={`/ask/${item.slug}`} className="ask-item">
                  {item.cover && <img className="ask-thumb" src={base + item.cover} alt="" loading="lazy" />}
                  <div className="ask-item-body">
                    <span className="ask-item-title">{v.title}</span>
                    <span className="ask-item-date">{formatDate(item.date, lang)}</span>
                    <span className="ask-item-excerpt">{v.excerpt}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && !error && papers.length > 0 && (
        <ul className="post-list">
          {papers.map((post) => (
            <li key={post.slug} className="post-item">
              <Link to={`/post/${post.slug}`} className="post-link">
                {post.thumb && <img className="post-thumb" src={base + post.thumb} alt="" loading="lazy" />}
                <div className="post-body">
                  <span className="post-title">{lang === 'en' && post.title_en ? post.title_en : post.title}</span>
                  <span className="post-series">
                    {[post.belge, seriesLabel(post.series, lang), post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  {post.description && (
                    <span className="post-desc">
                      {excerpt(lang === 'en' && post.description_en ? post.description_en : post.description)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
