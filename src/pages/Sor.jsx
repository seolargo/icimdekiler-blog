import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'
import { usePosts } from '../usePosts.js'
import { fold, matchesTokens } from '../search.js'
import { sor as sorClaude, KEY_STORAGE } from '../ask.js'

// Sor — "şu makaleye bak" yerine doğrudan cevap.
//
// İki kip var:
//  1. Anahtar girilmişse: soru, duvar kataloğunun tamamıyla birlikte modele
//     gider ve cevap oradan kurulur. Kelime değil anlam eşleşir.
//  2. Anahtar yoksa: kelime eşleştirmeli yedek. Sorunu anlamaz, sadece
//     eşleşen duvarları listeler — bu sınır arayüzde açıkça söyleniyor.
export default function Sor() {
  const { t, lang } = useLang()
  const { posts } = usePosts()
  const [params, setParams] = useSearchParams()

  const [soru, setSoru] = useState(params.get('q') || '')
  const [walls, setWalls] = useState(null)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '')
  const [keyAcik, setKeyAcik] = useState(false)
  const [cevap, setCevap] = useState('')
  const [calisiyor, setCalisiyor] = useState(false)
  const [hata, setHata] = useState(null)
  const iptal = useRef(null)

  useHead({ title: t('ask'), description: t('askIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}duvarlar.json`)
      .then((r) => r.json())
      .then((d) => setWalls(d.walls || []))
      .catch(() => setWalls([]))
  }, [])

  const q = soru.trim()

  // --- yedek kip: kelime eşleştirme (anahtar yokken) ---------------------
  const terimler = useMemo(() => {
    const dur = new Set(
      ('nasil ne neden nicin nedir mi mu ve ile bir bu su icin gibi daha ama ancak veya ' +
        'yapmali yapmaliyim etmeli olur olmali lazim gerek gerekir hangi kim nerede ' +
        'the a an is are how why what when should we my our to of in on for and or').split(' '),
    )
    return fold(q).split(/\s+/).filter((w) => w.length > 2 && !dur.has(w))
  }, [q])

  const eslesen = useMemo(() => {
    if (!terimler.length || !walls) return []
    const alan = (w) =>
      fold(
        `${w.id} ${w.title} ${w.kural} ${w.kirilir} ${w.neden} ${w.kaynak.join(' ')} ` +
          (w.sinama || []).map((x) => `${x.kaynak} ${x.not}`).join(' '),
      )
    return walls
      .map((w) => ({ w, n: terimler.filter((tk) => matchesTokens(tk, alan(w), true)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || a.w.id.localeCompare(b.w.id))
      .slice(0, 4)
  }, [walls, terimler])

  // --- gönder -------------------------------------------------------------
  async function gonder(e) {
    e.preventDefault()
    if (!q) return
    setParams({ q }, { replace: true })
    setHata(null)

    if (!apiKey) return // yedek kip zaten render ediliyor

    iptal.current?.abort()
    const ctrl = new AbortController()
    iptal.current = ctrl
    setCevap('')
    setCalisiyor(true)
    try {
      const { reddedildi, kesildi } = await sorClaude({
        apiKey,
        soru: q,
        walls: walls || [],
        posts,
        signal: ctrl.signal,
        onDelta: (d) => setCevap((c) => c + d),
      })
      if (reddedildi) setHata(t('askRefused'))
      else if (kesildi) setHata(t('askTruncated'))
    } catch (err) {
      if (err?.name !== 'AbortError') setHata(err?.message || String(err))
    } finally {
      setCalisiyor(false)
    }
  }

  function anahtarKaydet(v) {
    setApiKey(v)
    if (v) localStorage.setItem(KEY_STORAGE, v)
    else localStorage.removeItem(KEY_STORAGE)
  }

  // Cevaptaki [D-27] kimliklerini duvar sayfasına bağla
  const cevapHtml = useMemo(() => {
    const parcalar = cevap.split(/(\[D-\d{2}\])/g)
    return parcalar.map((p, i) => {
      const m = p.match(/^\[(D-\d{2})\]$/)
      if (!m) return <span key={i}>{p}</span>
      return (
        <Link key={i} className="sor-ref" to={`/duvarlar?q=${encodeURIComponent(m[1])}`}>
          {m[1]}
        </Link>
      )
    })
  }, [cevap])

  return (
    <div className="sor">
      <p className="sor-intro muted">{t('askIntro')}</p>

      <form className="sor-form" onSubmit={gonder}>
        <input
          type="search"
          className="search-input"
          placeholder={t('askPlaceholder')}
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          aria-label={t('askPlaceholder')}
        />
        {apiKey && (
          <button type="submit" className="btn sor-send" disabled={calisiyor || !q}>
            {calisiyor ? t('askThinking') : t('askSend')}
          </button>
        )}
      </form>

      {/* --- anahtar --- */}
      <div className="sor-key">
        <button type="button" className="sor-key-toggle" onClick={() => setKeyAcik((v) => !v)}>
          {apiKey ? t('askKeySet') : t('askKeyMissing')}
        </button>
        {keyAcik && (
          <div className="sor-key-panel">
            <p className="muted">{t('askKeyNote')}</p>
            <input
              type="password"
              className="search-input"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => anahtarKaydet(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
      </div>

      {hata && <p className="error sor-error">{hata}</p>}

      {/* --- cevap (model) --- */}
      {apiKey && (cevap || calisiyor) && (
        <div className="sor-answer">
          <p className="sor-lede">{t('askLede')}</p>
          <div className="sor-text">
            {cevapHtml}
            {calisiyor && <span className="sor-caret" aria-hidden="true" />}
          </div>
        </div>
      )}

      {/* --- yedek kip: anahtar yoksa --- */}
      {!apiKey && q && (
        <div className="sor-fallback">
          <p className="sor-lede">{t('askFallbackNote')}</p>
          {eslesen.length === 0 ? (
            <p className="muted sor-empty">{t('askNothing')}</p>
          ) : (
            eslesen.map(({ w }) => (
              <article key={w.id} className="sor-card">
                <h2 className="sor-do">{w.kural}</h2>
                <div className="sor-row sor-breaks">
                  <span className="sor-lbl">{t('askBreaks')}</span>
                  <p>{w.kirilir}</p>
                </div>
                <p className="sor-from">
                  <Link to={`/duvarlar?q=${encodeURIComponent(w.id)}`}>{w.id}</Link>
                  <span className="muted"> · {w.kaynak.join(' · ')}</span>
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  )
}
