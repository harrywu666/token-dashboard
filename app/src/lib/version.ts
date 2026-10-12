const KEY = 'tdash_version'

/** Poll version.json; reload once when frontend build changes. */
export function startVersionWatch() {
  const check = async () => {
    try {
      const r = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' })
      if (!r.ok) return
      const { v } = (await r.json()) as { v?: string }
      if (!v) return
      const prev = sessionStorage.getItem(KEY)
      if (prev == null) {
        sessionStorage.setItem(KEY, v)
        return
      }
      if (prev !== v) {
        sessionStorage.setItem(KEY, v)
        location.reload()
      }
    } catch {
      /* ignore offline / 404 during first deploy */
    }
  }
  check()
  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
}
