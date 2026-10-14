import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsk, useAskFonts, pick, formatDate } from '../useAsk.js'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'

// Tek bir Aşk yazısı. Gövde HTML'i build-ask.js'te kaçışlanarak üretilir.
export default function AskPost() {
  const { slug } = useParams()
  const { items, loading, error } = useAsk()
  const { t, lang } = useLang()
  useAskFonts()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  const item = items.find((i) => i.slug === slug)
  const v = item ? pick(item, lang) : null
  useHead({ title: v?.title || t('love'), description: v?.excerpt, image: item?.cover ? '/' + item.cover : '/profile.jpeg' })

  if (loading) return <p className="muted">{t('loading')}</p>
  if (error) return <p className="error">{t('error')}: {error.message}</p>
  if (!item) {
    return (
      <div className="ask">
        <Link to="/ask" className="back-link">← {t('love')}</Link>
        <p className="muted">{t('notFound')}</p>
      </div>
    )
  }

  const base = import.meta.env.BASE_URL
  const html = v.html.replace(/src="ask\//g, `src="${base}ask/`)

  return (
    <article className="ask ask-post">
      {item.cover && <img className="ask-cover" src={base + item.cover} alt="" />}
      <header className="ask-head">
        <h1 className="ask-title">{v.title}</h1>
        <time className="ask-date" dateTime={item.date.slice(0, 10)}>{formatDate(item.date, lang)}</time>
      </header>
      <div className="ask-body" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
