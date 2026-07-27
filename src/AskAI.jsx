import { useEffect, useState } from 'react'
import { useLang } from './i18n.jsx'

// "Yazılarımı yapay zekâna ver" — ziyaretçi tüm yazıları KENDİ sohbetine (ChatGPT,
// Claude, NotebookLM…) aktarıp orada konuşur. Sunucu/anahtar/maliyet yok.
// İki yol: (1) llms.txt içeriğini panoya kopyala (her yerde çalışır),
//          (2) tam-metin adresine işaret eden hazır istemle ChatGPT/Claude aç.
export default function AskAI() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = import.meta.env.BASE_URL
  const fullUrl = `${origin}${base}llms-full.txt`

  const copyDigest = async () => {
    try {
      const txt = await fetch(`${base}llms.txt`).then((r) => r.text())
      await navigator.clipboard.writeText(`${t('askAiPrefix')}\n\n${txt}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      /* pano yoksa sessizce geç */
    }
  }

  const openChat = (kind) => {
    const prompt = `${t('askAiPrompt')} ${fullUrl}`
    const url =
      kind === 'claude'
        ? `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
        : `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button type="button" className="portrait-btn" onClick={() => setOpen(true)}>
        <span className="portrait-btn-spark" aria-hidden="true">✳</span>
        {t('askAiButton')}
      </button>

      {open && (
        <div className="portrait-overlay" onClick={() => setOpen(false)}>
          <div
            className="portrait-modal askai-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t('askAiButton')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="portrait-x"
              onClick={() => setOpen(false)}
              aria-label={t('portraitClose')}
            >
              ×
            </button>

            <p className="portrait-eyebrow">{t('askAiEyebrow')}</p>
            <p className="portrait-intro">{t('askAiIntro')}</p>

            <div className="askai-actions">
              <button type="button" className="btn askai-primary" onClick={copyDigest}>
                {copied ? t('askAiCopied') : t('askAiCopy')}
              </button>
              <button type="button" className="btn" onClick={() => openChat('chatgpt')}>
                {t('askAiChatGPT')}
              </button>
              <button type="button" className="btn" onClick={() => openChat('claude')}>
                {t('askAiClaude')}
              </button>
            </div>

            <p className="askai-note muted">
              {t('askAiFullNote')}{' '}
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                llms-full.txt
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
