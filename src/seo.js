import { useEffect } from 'react'

export const SITE_NAME = 'Ömer Faruk Yavuz'
export const SITE_DESCRIPTION =
  'Ömer Faruk Yavuz — mühendislik, tasarım ve sistem düşüncesi üzerine PDF makaleler.'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Rota değiştikçe <head>'i günceller: title, description, canonical, Open Graph,
// Twitter Card ve (opsiyonel) Article JSON-LD. Prerender ile aynı çıktıyı üretir.
export function useHead({ title, description, type = 'website', image, jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    const desc = description || SITE_DESCRIPTION
    const origin = window.location.origin
    const url = origin + window.location.pathname
    const img = image ? origin + image : undefined

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertLink('canonical', url)

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', url)
    if (img) upsertMeta('property', 'og:image', img)

    upsertMeta('name', 'twitter:card', img ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    if (img) upsertMeta('name', 'twitter:image', img)

    // JSON-LD (varsa) tek bir yönetilen script içinde tut
    let ld = document.getElementById('ld-json')
    if (jsonLd) {
      if (!ld) {
        ld = document.createElement('script')
        ld.type = 'application/ld+json'
        ld.id = 'ld-json'
        document.head.appendChild(ld)
      }
      ld.textContent = JSON.stringify(jsonLd)
    } else if (ld) {
      ld.remove()
    }
  }, [title, description, type, image, jsonLd])
}
