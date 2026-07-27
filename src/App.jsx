import { Link, NavLink, Outlet } from 'react-router-dom'
import { useLang } from './i18n.jsx'
import AuthorPortrait from './AuthorPortrait.jsx'
import AskAI from './AskAI.jsx'

// blog başlığı ve alt bilgi — buradan kişiselleştirebilirsin
export const SITE = {
  title: 'Ömer Faruk Yavuz',
}

// İletişim bağlantıları — buradan düzenleyebilirsin. `url` boş bırakılan atlanır.
// E-posta için "mailto:...", diğerleri için tam adres yaz.
export const CONTACTS = [
  { label: 'E-posta', url: '' },
  { label: 'GitHub', url: 'https://github.com/seolargo' },
  { label: 'LinkedIn', url: '' },
  { label: 'X', url: '' },
  { label: 'Medium', url: '' },
].filter((c) => c.url)

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
        <div className="brand">
          <Link to="/" className="brand-person">
            <img
              className="brand-photo"
              src={`${import.meta.env.BASE_URL}profile.jpeg`}
              alt={SITE.title}
            />
            <span className="brand-name">{SITE.title}</span>
            <span className="brand-role">{t('role')}</span>
          </Link>
          <div className="ai-actions">
            <AuthorPortrait />
            <AskAI />
          </div>
          <Link to="/" className="brand-title">İçimdekiler</Link>
        </div>
      </header>

      <nav className="site-nav" aria-label={t('sections')}>
        <NavLink to="/" end className="nav-tab">
          {t('writings')}
        </NavLink>
        <NavLink to="/rehberler" className="nav-tab">
          {t('guides')}
        </NavLink>
        <NavLink to="/muzik" className="nav-tab">
          {t('music')}
        </NavLink>
        <NavLink to="/oneriler" className="nav-tab">
          {t('recommendations')}
        </NavLink>
      </nav>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        {CONTACTS.length > 0 && (
          <div className="footer-contact">
            <span className="footer-label">{t('contact')}</span>
            {CONTACTS.map((c) => {
              const external = c.url.startsWith('http')
              return (
                <a
                  key={c.label}
                  href={c.url}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {c.label}
                </a>
              )
            })}
          </div>
        )}
        <div className="footer-meta">
          <span>© {new Date().getFullYear()} {SITE.title}</span>
          <span className="footer-updated">
            {t('lastUpdate')}:{' '}
            {new Date(__LAST_CHANGE__).toLocaleString(t('locale'), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </footer>
    </div>
  )
}
