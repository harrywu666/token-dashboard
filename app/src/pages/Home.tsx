import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/dashboard/site-header'
import { TokenCard } from '@/components/TokenCard'
import { loadPeriods, loadTokens, type Period, type TokenMeta } from '@/lib/data'

export function Home({ clock }: { clock?: string }) {
  const [tokens, setTokens] = useState<TokenMeta[]>([])
  const [periodsMap, setPeriodsMap] = useState<Record<string, Period[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ts = await loadTokens()
        if (cancelled) return
        setTokens(ts)
        const map: Record<string, Period[]> = {}
        await Promise.all(
          ts.map(async (t) => {
            map[t.id] = await loadPeriods(t.id, t.chain)
          }),
        )
        if (!cancelled) setPeriodsMap(map)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SiteHeader
        title="调查概览"
        subtitle="持币地址与链上热度追踪 · 不含价格涨跌"
        clock={clock}
      />
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {loading && <div className="text-muted-foreground">加载中…</div>}
          {error && <div className="text-down">{error}</div>}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-2">
              {tokens.map((t) => (
                <TokenCard key={t.id} token={t} periods={periodsMap[t.id] || []} />
              ))}
              {!tokens.length && (
                <div className="text-muted-foreground">暂无代币配置</div>
              )}
            </div>
          )}
        </div>
        <footer className="px-4 pb-4 text-center text-xs text-muted-foreground lg:px-6">
          数据每小时更新，非秒级实时 · 有新版本会自动刷新
        </footer>
      </div>
    </>
  )
}
