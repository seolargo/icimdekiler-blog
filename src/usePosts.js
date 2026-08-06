import { useEffect, useState } from 'react'

// posts.json manifestini yükler (scripts/generate-manifest.js üretir).
//
// Ayrıca yerel-yalnız kütüphaneyi (yerel/posts.local.json) SADECE dev
// sunucusunda üstüne ekler. O klasör gitignore'da ve public/ dışında olduğu
// için ne depoya ne derlemeye girer; üretimde /yerel/... diye bir yol yoktur,
// dolayısıyla bu istek de hiç yapılmaz. Yerel kayıtlar `local: true` taşır.
export function usePosts() {
  const [state, setState] = useState({ posts: [], loading: true, error: null })

  useEffect(() => {
    let alive = true

    const ana = fetch(`${import.meta.env.BASE_URL}posts.json`).then((r) => {
      if (!r.ok) throw new Error(`posts.json yüklenemedi (${r.status})`)
      return r.json()
    })

    const yerel = import.meta.env.DEV
      ? fetch('/yerel/posts.local.json')
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []) // yerel kütüphane yoksa sessizce geç
      : Promise.resolve([])

    Promise.all([ana, yerel])
      .then(([posts, ek]) => {
        const liste = Array.isArray(ek) && ek.length ? [...ek, ...posts] : posts
        if (alive) setState({ posts: liste, loading: false, error: null })
      })
      .catch((error) => alive && setState({ posts: [], loading: false, error }))

    return () => {
      alive = false
    }
  }, [])

  return state
}
