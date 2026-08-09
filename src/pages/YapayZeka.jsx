import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../usePosts.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Yapay zekâ / etmen bölümü. Seçki public/ai.json'dan okunur:
//   { intro, intro_en, groups: [{ id, title, title_en, blurb, blurb_en, slugs: [] }] }
//
// Not: burada `tab` alanı KULLANILMIYOR. posts.json'daki `tab`, prerender'da
// "dışa kapalı" anlamına geliyor (PDF/metin dist'ten siliniyor). Bu bölüm
// açık yazıları gruplayan bir görünüm; yazılar Yazılar sekmesinde de duruyor.
export default function YapayZeka() {
  const { posts, loading, error } = usePosts()
  const { t, lang } = useLang()
  const [data, setData] = useState(null)

  useHead({ title: t('ai'), description: t('aiIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}ai.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ groups: [] }))
  }, [])

  const bySlug = new Map(posts.map((p) => [p.slug, p]))
  const pick = (l) => (lang === 'en' && l.en ? l.en : l.tr)

  return (
    <>
      {data && (
        <p className="rec-intro muted">
          {pick({ tr: data.intro, en: data.intro_en })}
        </p>
      )}

      {loading && <p className="muted">{t('loading')}</p>}
      {error && <p className="error">{t('error')}: {error.message}</p>}

      {!loading && !error && data?.groups?.map((g) => {
        const items = g.slugs.map((s) => bySlug.get(s)).filter(Boolean)
        if (!items.length) return null
        return (
          <section key={g.id} className="ai-group">
            <h2 className="section-head">{pick({ tr: g.title, en: g.title_en })}</h2>
            <p className="muted ai-blurb">{pick({ tr: g.blurb, en: g.blurb_en })}</p>
            <ul className="post-list">
              {items.map((post) => (
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
                      {(post.belge || post.pages > 0 || post.priority) && (
                        <span className="post-series">
                          {post.priority ? (
                            <span
                              className={`post-priority p${post.priority}`}
                              title={t('priorityHint')}
                            >
                              {post.priority}
                            </span>
                          ) : null}
                          {[post.belge, post.pages > 0 ? `${post.pages} ${t('pagesUnit')}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
