import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Detail } from '@/pages/Detail'
import { Home } from '@/pages/Home'

type Route = { page: 'home' } | { page: 'detail'; id: string }

function parseHash(): Route {
  const h = (window.location.hash || '#/').replace(/^#/, '')
  const m = h.match(/^\/?token\/([^/?#]+)/)
  if (m) return { page: 'detail', id: decodeURIComponent(m[1]) }
  return { page: 'home' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash())
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('zh-CN'))

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('zh-CN')), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <Layout clock={clock}>
      {route.page === 'home' ? <Home /> : <Detail id={route.id} />}
    </Layout>
  )
}
