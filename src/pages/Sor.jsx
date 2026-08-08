import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'
import { usePosts } from '../usePosts.js'
import { fold, matchesTokens } from '../search.js'

// Sor — "şu makaleye bak" yerine doğrudan cevap.
//
// Cevap uydurulmuyor: duvar kataloğundan derleniyor. Bir soru geldiğinde
// eşleşen duvarlar bulunur ve cevap şu biçimde kurulur — ne yapılacak (kural),
// nerede geçmez (kırılma koşulu), doğrulanmış mı (sınama kaydı), nereden
// geliyor (kaynak). Yani cevabın her cümlesinin arkasında kayıtlı bir madde
// var; model çıkarımı yok.
//
// Duvar tutmazsa yazılara düşülür ve bu açıkça söylenir: elde kural yok,
// yalnızca okuyacak metin var.
export default function Sor() {
  const { t, lang } = useLang()
  const { posts } = usePosts()
  const [params, setParams] = useSearchParams()
  const [soru, setSoru] = useState(params.get('q') || '')
  const [walls, setWalls] = useState(null)

  useHead({ title: t('ask'), description: t('askIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}duvarlar.json`)
      .then((r) => r.json())
      .then((d) => setWalls(d.walls || []))
      .catch(() => setWalls([]))
  }, [])

  const q = soru.trim()

  // Soru cümlesinden anlamlı sözcükleri ayıkla: soru kalıpları ve bağlaçlar
  // elenir, kalanların her biri ayrı bir arama terimi olur.
  const terimler = useMemo(() => {
    const dur = new Set(
      ('nasil ne neden nicin nedir mi mu mı mü ve ile bir bu su o icin gibi daha en ama ancak veya ' +
        'yapmali yapmaliyim etmeli olur olmali lazim gerek gerekir hangi kim nerede ne zaman ' +
        'the a an is are how why what when should i we my our to of in on for and or').split(' '),
    )
    return fold(q)
      .split(/\s+/)
      .filter((w) => w.length > 2 && !dur.has(w))
  }, [q])

  const alan = (w) =>
    fold(
      `${w.id} ${w.title} ${w.kural} ${w.kirilir} ${w.neden} ${w.kaynak.join(' ')} ` +
        (w.sinama || []).map((x) => `${x.kaynak} ${x.not}`).join(' '),
    )

  const cevap = useMemo(() => {
    if (!terimler.length || !walls) return []
    return walls
      .map((w) => {
        const hay = alan(w)
        const tutan = terimler.filter((tk) => matchesTokens(tk, hay, true))
        return { w, n: tutan.length }
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || a.w.id.localeCompare(b.w.id))
      .slice(0, 4)
  }, [walls, terimler])

  // Duvar tutmazsa okunacak metne düş
  const yazilar = useMemo(() => {
    if (!terimler.length || cevap.length) return []
    return posts
      .filter((p) => !p.tab)
      .map((p) => {
        const hay = fold(`${p.title} ${p.description || ''}`)
        return { p, n: terimler.filter((tk) => matchesTokens(tk, hay, true)).length }
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n || (b.p.priority || 0) - (a.p.priority || 0))
      .slice(0, 3)
  }, [posts, terimler, cevap.length])

  const gonder = (e) => {
    e.preventDefault()
    setParams(q ? { q } : {}, { replace: true })
  }

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
      </form>

      {q && walls && cevap.length === 0 && yazilar.length === 0 && (
        <p className="muted sor-empty">{t('askNothing')}</p>
      )}

      {cevap.length > 0 && (
        <div className="sor-answer">
          <p className="sor-lede">{t('askLede')}</p>

          {cevap.map(({ w }) => (
            <article key={w.id} className="sor-card">
              <h2 className="sor-do">{w.kural}</h2>

              <div className="sor-row sor-breaks">
                <span className="sor-lbl">{t('askBreaks')}</span>
                <p>{w.kirilir}</p>
              </div>

              {(w.sinama || []).length > 0 ? (
                (w.sinama || []).map((x, i) => (
                  <div key={i} className="sor-row sor-tested">
                    <span className="sor-lbl">
                      {t('askTested')} · {x.sonuc} · {x.tarih}
                    </span>
                    <p>{x.not}</p>
                    <a href={x.url} target="_blank" rel="noopener noreferrer">
                      {x.kaynak} ↗
                    </a>
                  </div>
                ))
              ) : (
                <p className="sor-untested muted">{t('askUntested')}</p>
              )}

              <p className="sor-from">
                <Link to={`/duvarlar?q=${encodeURIComponent(w.id)}`}>{w.id}</Link>
                <span className="muted"> · {w.kaynak.join(' · ')}</span>
              </p>
            </article>
          ))}
        </div>
      )}

      {yazilar.length > 0 && (
        <div className="sor-fallback">
          <p className="sor-lede">{t('askNoRule')}</p>
          <ul className="sor-posts">
            {yazilar.map(({ p }) => (
              <li key={p.slug}>
                <Link to={`/post/${p.slug}`}>
                  {lang === 'en' && p.title_en ? p.title_en : p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
