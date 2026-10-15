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
//
// "Aşk sözlüğü" kipi ayrı bir veri kullanır: public/ask-kavramlar.json
// (scripts/build-ask-kavramlar.js; liste content/ask-kavramlar.json). Yazı
// bağlantıları /ask/<slug>'a gider. Kip ?m=ask ile bağlantıda korunur.

const nf = (n, locale) => n.toLocaleString(locale)

export default function Kavramlar() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [params, setParams] = useSearchParams()
  const { posts } = usePosts()
  const [mode, setModeState] = useState(params.get('m') === 'ask' ? 'ask' : 'tek') // tek | ikili | belirgin | adlar | ask
  const [askData, setAskData] = useState(null)
  const [askTitles, setAskTitles] = useState(new Map())
  const isAsk = mode === 'ask'
  const setMode = (m) => {
    setModeState(m)
    const next = new URLSearchParams(params)
    if (m === 'ask') next.set('m', 'ask')
    else next.delete('m')
    next.delete('k')
    setParams(next, { replace: true })
  }
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
      .catch(() =>
        setData({ concepts: [], phrases: [], distinct: [], names: [], docs: 0, tokens: 0, vocab: 0 }),
      )
    fetch(`${import.meta.env.BASE_URL}ask-kavramlar.json`)
      .then((r) => r.json())
      .then(setAskData)
      .catch(() => setAskData({ concepts: [], docs: 0, tokens: 0, vocab: 0 }))
    fetch(`${import.meta.env.BASE_URL}ask.json`)
      .then((r) => r.json())
      .then((items) => setAskTitles(new Map(items.map((i) => [i.slug, i]))))
      .catch(() => {})
  }, [])

  const MODES = [
    { id: 'tek', field: 'concepts', label: 'conceptsSingle' },
    { id: 'ikili', field: 'phrases', label: 'conceptsPairs' },
    { id: 'belirgin', field: 'distinct', label: 'conceptsDistinct' },
    { id: 'adlar', field: 'names', label: 'conceptsNames' },
    { id: 'ask', field: null, label: 'conceptsLove' },
  ]
  const listOf = (id) =>
    id === 'ask' ? askData?.concepts || [] : data?.[MODES.find((m) => m.id === id).field] || []
  const ds = isAsk ? askData || { docs: 0, tokens: 0, vocab: 0 } : data
  const askByKey = useMemo(() => new Map((askData?.concepts || []).map((c) => [c.k, c])), [askData])
  const list = listOf(mode)
  // anahtar -> kayıt ve anahtar -> hangi kipte olduğu (komşu kavram bağlantıları için)
  const [byKey, modeOf] = useMemo(() => {
    const m = new Map()
    const w = new Map()
    for (const { id, field } of MODES.filter((m) => m.field))
      for (const c of data?.[field] || []) {
        if (!m.has(c.k)) w.set(c.k, id)
        m.set(c.k, m.get(c.k) || c)
      }
    return [m, w]
  }, [data])
  const titleOf = useMemo(() => {
    const m = new Map()
    for (const p of posts) m.set(p.slug, lang === 'en' && p.title_en ? p.title_en : p.title)
    return m
  }, [posts, lang])
  const askTitleOf = (slug) => {
    const it = askTitles.get(slug)
    return it ? (lang === 'en' && it.en ? it.en.title : it.tr.title) : slug
  }

  // ?k=… ile gelindiğinde kavramın bulunduğu kipe geç (ad ise "Adlar", vb.)
  useEffect(() => {
    if (params.get('m') !== 'ask' && selected && modeOf.has(selected)) setModeState(modeOf.get(selected))
    // yalnızca veri yüklendiğinde / bağlantıdan gelindiğinde
  }, [data, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const needle = fold(q.trim())
  const shown = useMemo(
    () => (needle ? list.filter((c) => fold(`${c.label} ${c.variants.join(' ')}`).includes(needle)) : list),
    [list, needle],
  )

  const active = selected ? (isAsk ? askByKey.get(selected) : byKey.get(selected)) : null
  // bulutta yazı boyutu: kipin kendi skorunun karekökü (tf, tf-idf…)
  const val = (c) => c.s ?? c.tf
  const max = shown.length ? Math.max(...shown.map(val)) : 1
  const min = shown.length ? Math.min(...shown.map(val)) : 1
  const size = (c) => {
    const r = (Math.sqrt(val(c)) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min) || 1)
    return (0.82 + r * 1.5).toFixed(2)
  }

  if (data === null || (isAsk && askData === null)) return <p className="muted">{t('loading')}</p>

  return (
    <div className="kv">
      <p className="kv-stats">
        <b>{nf(ds.docs, t('locale'))}</b> {t(isAsk ? 'conceptsLoveDocs' : 'conceptsDocs')} ·{' '}
        <b>{nf(ds.tokens, t('locale'))}</b> {t('conceptsWords')} · <b>{nf(ds.vocab, t('locale'))}</b>{' '}
        {t('conceptsForms')}
      </p>

      <div className="kv-controls">
        <div className="kv-modes" role="group" aria-label={t('conceptsMode')}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`kv-mode${mode === m.id ? ' is-active' : ''}`}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {t(m.label)} <span className="kv-n">{listOf(m.id).length}</span>
            </button>
          ))}
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
              style={{
                fontSize: `${size(c)}rem`,
                opacity: 0.55 + 0.45 * Math.min(1, c.df / (ds.docs * 0.5)),
              }}
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
            {ds.docs} {t('conceptsInDocs')}
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
                    if (!isAsk) setModeState(modeOf.get(n) || 'tek')
                    select(n)
                  }}
                >
                  {(isAsk ? askByKey : byKey).get(n)?.label || n}
                </button>
              ))}
            </p>
          )}

          <span className="kv-lbl">{t('conceptsTop')}</span>
          <ol className="kv-posts">
            {active.top.map(([slug, n]) => (
              <li key={slug}>
                {isAsk ? (
                  <Link to={`/ask/${encodeURIComponent(slug)}`}>{askTitleOf(slug)}</Link>
                ) : (
                  <Link to={`/post/${encodeURIComponent(slug)}`}>{titleOf.get(slug) || slug}</Link>
                )}
                <span className="kv-count">{n}×</span>
              </li>
            ))}
          </ol>

          {!isAsk && (
            <Link className="kv-searchlink" to={`/?q=${encodeURIComponent(active.label)}`}>
              {t('conceptsSearchAll')} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
