import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'
import { usePosts } from '../usePosts.js'
import { fold } from '../search.js'

// Kavramlar — korpusun kelime haritası.
// Veri public/kavramlar.json'dan gelir (scripts/build-kavramlar.js üretir):
// tek kelimelik kavramlar, ikili tamlamalar, her birinin en yoğun geçtiği
// yazılar ve birlikte geçtiği komşu kavramlar.
// Kavramlar makale diliyle (Türkçe) kalır; yalnızca arayüz çevrilir.

const nf = (n, locale) => n.toLocaleString(locale)

export default function Kavramlar() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [params, setParams] = useSearchParams()
  const { posts } = usePosts()
  const [mode, setMode] = useState('tek') // tek | ikili
  const [q, setQ] = useState('')

  const selected = params.get('k') || null
  const select = (k) => {
    const next = new URLSearchParams(params)
    if (k) next.set('k', k)
    else next.delete('k')
    setParams(next, { replace: true })
  }

  useHead({ title: t('conceptsTitle'), description: t('conceptsMeta'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}kavramlar.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ concepts: [], phrases: [], docs: 0, tokens: 0, vocab: 0 }))
  }, [])

  const list = (mode === 'tek' ? data?.concepts : data?.phrases) || []
  const byKey = useMemo(() => {
    const m = new Map()
    for (const c of data?.concepts || []) m.set(c.k, c)
    for (const c of data?.phrases || []) m.set(c.k, c)
    return m
  }, [data])
  const titleOf = useMemo(() => {
    const m = new Map()
    for (const p of posts) m.set(p.slug, lang === 'en' && p.title_en ? p.title_en : p.title)
    return m
  }, [posts, lang])

  const needle = fold(q.trim())
  const shown = useMemo(
    () => (needle ? list.filter((c) => fold(`${c.label} ${c.variants.join(' ')}`).includes(needle)) : list),
    [list, needle],
  )

  const active = selected ? byKey.get(selected) : null
  // bulutta yazı boyutu: frekansın karekökü (baskın kavram her şeyi ezmesin)
  const max = shown.length ? Math.max(...shown.map((c) => c.tf)) : 1
  const min = shown.length ? Math.min(...shown.map((c) => c.tf)) : 1
  const size = (tf) => {
    const r = (Math.sqrt(tf) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min) || 1)
    return (0.82 + r * 1.5).toFixed(2)
  }

  if (data === null) return <p className="muted">{t('loading')}</p>

  return (
    <div className="kv">
      <p className="kv-stats">
        <b>{nf(data.docs, t('locale'))}</b> {t('conceptsDocs')} · <b>{nf(data.tokens, t('locale'))}</b>{' '}
        {t('conceptsWords')} · <b>{nf(data.vocab, t('locale'))}</b> {t('conceptsForms')}
      </p>

      <div className="kv-controls">
        <div className="kv-modes" role="group" aria-label={t('conceptsMode')}>
          <button
            type="button"
            className={`kv-mode${mode === 'tek' ? ' is-active' : ''}`}
            aria-pressed={mode === 'tek'}
            onClick={() => setMode('tek')}
          >
            {t('conceptsSingle')} <span className="kv-n">{data.concepts.length}</span>
          </button>
          <button
            type="button"
            className={`kv-mode${mode === 'ikili' ? ' is-active' : ''}`}
            aria-pressed={mode === 'ikili'}
            onClick={() => setMode('ikili')}
          >
            {t('conceptsPairs')} <span className="kv-n">{data.phrases.length}</span>
          </button>
        </div>
        <div className="kv-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('conceptsSearch')}
            aria-label={t('conceptsSearch')}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="muted">{t('noResults')}</p>
      ) : (
        <div className="kv-cloud">
          {shown.map((c) => (
            <button
              key={c.k}
              type="button"
              className={`kv-word${selected === c.k ? ' is-active' : ''}`}
              style={{ fontSize: `${size(c.tf)}rem`, opacity: 0.55 + 0.45 * (c.df / data.docs) }}
              onClick={() => select(selected === c.k ? null : c.k)}
              title={`${c.tf} ${t('conceptsTimes')} · ${c.df} ${t('conceptsInDocs')}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="kv-detail">
          <div className="kv-detail-head">
            <h2>{active.label}</h2>
            <button type="button" className="kv-close" onClick={() => select(null)}>
              {t('portraitClose')}
            </button>
          </div>
          <p className="kv-detail-stats">
            <b>{nf(active.tf, t('locale'))}</b> {t('conceptsTimes')} · <b>{active.df}</b> /{' '}
            {data.docs} {t('conceptsInDocs')}
          </p>

          {active.variants?.length > 1 && (
            <p className="kv-variants">
              <span className="kv-lbl">{t('conceptsVariants')}</span>
              {active.variants.map((v) => (
                <span key={v} className="kv-var">
                  {v}
                </span>
              ))}
            </p>
          )}

          {active.near?.length > 0 && (
            <p className="kv-near">
              <span className="kv-lbl">{t('conceptsNear')}</span>
              {active.near.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="kv-nearw"
                  onClick={() => {
                    setMode('tek')
                    select(n)
                  }}
                >
                  {byKey.get(n)?.label || n}
                </button>
              ))}
            </p>
          )}

          <span className="kv-lbl">{t('conceptsTop')}</span>
          <ol className="kv-posts">
            {active.top.map(([slug, n]) => (
              <li key={slug}>
                <Link to={`/post/${encodeURIComponent(slug)}`}>{titleOf.get(slug) || slug}</Link>
                <span className="kv-count">{n}×</span>
              </li>
            ))}
          </ol>

          <Link className="kv-searchlink" to={`/?q=${encodeURIComponent(active.label)}`}>
            {t('conceptsSearchAll')} →
          </Link>
        </div>
      )}
    </div>
  )
}
