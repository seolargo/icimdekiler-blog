import { Link, Outlet } from 'react-router-dom'
import { useLang } from './i18n.jsx'

// blog başlığı ve alt bilgi — buradan kişiselleştirebilirsin
export const SITE = {
  title: 'Ömer Faruk Yavuz',
}

function LangSwitch() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label="Dil / Language">
      <button
        type="button"
        className={`lang-btn${lang === 'tr' ? ' is-active' : ''}`}
        onClick={() => setLang('tr')}
        aria-pressed={lang === 'tr'}
      >
        TR
      </button>
      <span className="lang-sep">/</span>
      <button
        type="button"
        className={`lang-btn${lang === 'en' ? ' is-active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )
}

export default function App() {
  const { t } = useLang()
  return (
    <div className="site">
      <LangSwitch />
      <header className="site-header">
        <Link to="/" className="brand">
          <img
            className="brand-photo"
            src={`${import.meta.env.BASE_URL}profile.jpeg`}
            alt={SITE.title}
          />
          <span className="brand-name">{SITE.title}</span>
          <span className="brand-role">{t('role')}</span>
          <span className="brand-title">İçimdekiler</span>
        </Link>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {SITE.title}</span>
      </footer>
    </div>
  )
}
