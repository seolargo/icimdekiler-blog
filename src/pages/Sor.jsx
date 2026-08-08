import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useHead } from '../seo.js'
import { useLang } from '../i18n.jsx'
import { fold, matchesTokens } from '../search.js'

// Sor — şimdilik gezinmede gizli (App.jsx ve prerender'da sekmesi yok);
// yalnızca doğrudan /sor adresiyle açılır.
//
// API anahtarı alan katman kaldırıldı. Sayfa artık dışarıya hiçbir istek
// atmıyor: eşleştirme tamamen tarayıcıda, duvar kataloğu üzerinde yapılıyor.
// Daha önce tarayıcıda saklanmış bir anahtar varsa aşağıdaki temizlik onu
// siler — arayüzü kaldırmak kayıtlı sırrı kendiliğinden silmez.
const ESKI_ANAHTAR = 'anthropic-api-key'

export default function Sor() {
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const [soru, setSoru] = useState(params.get('q') || '')
  const [walls, setWalls] = useState(null)

  useHead({ title: t('ask'), description: t('askIntro'), image: '/profile.jpeg' })

  useEffect(() => {
    try {
      localStorage.removeItem(ESKI_ANAHTAR)
    } catch {
      /* depolama kapalıysa geç */
    }
    fetch(`${import.meta.env.BASE_URL}duvarlar.json`)
      .then((r) => r.json())
      .then((d) => setWalls(d.walls || []))
      .catch(() => setWalls([]))
  }, [])

  const q = soru.trim()

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

  return (
    <div className="sor">
      <p className="sor-intro muted">{t('askIntro')}</p>

      <form className="sor-form" onSubmit={(e) => { e.preventDefault(); setParams(q ? { q } : {}, { replace: true }) }}>
        <input
          type="search"
          className="search-input"
          placeholder={t('askPlaceholder')}
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          aria-label={t('askPlaceholder')}
        />
      </form>

      {q && walls && (
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
