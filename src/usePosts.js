import { useEffect, useState } from 'react'

// posts.json manifestini yükler (scripts/generate-manifest.js üretir)
export function usePosts() {
  const [state, setState] = useState({ posts: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}posts.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`posts.json yüklenemedi (${r.status})`)
        return r.json()
      })
      .then((posts) => alive && setState({ posts, loading: false, error: null }))
      .catch((error) => alive && setState({ posts: [], loading: false, error }))
    return () => {
      alive = false
    }
  }, [])

  return state
}
