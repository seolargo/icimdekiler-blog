import { Link, Outlet } from 'react-router-dom'

// blog başlığı ve alt bilgi — buradan kişiselleştirebilirsin
export const SITE = {
  title: 'Ömer Faruk Yavuz',
}

export default function App() {
  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="brand">
          <img
            className="brand-photo"
            src={`${import.meta.env.BASE_URL}profile.jpeg`}
            alt={SITE.title}
          />
          <span className="brand-name">{SITE.title}</span>
          <span className="brand-role">Computer Engineer, Yıldız Technical University</span>
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
