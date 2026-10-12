import { useEffect, useState } from 'react'
import { TokenCard } from '@/components/TokenCard'
import { loadPeriods, loadTokens, type Period, type TokenMeta } from '@/lib/data'

export function Home() {
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

  if (loading) {
    return <div className="text-muted-foreground">加载中…</div>
  }
  if (error) {
    return <div className="text-down">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">调查概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          持币地址与链上热度追踪 · 数据每小时自动更新 · 不含价格涨跌
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-2">
        {tokens.map((t) => (
          <TokenCard key={t.id} token={t} periods={periodsMap[t.id] || []} />
        ))}
      </div>
      {!tokens.length && <div className="text-muted-foreground">暂无代币配置</div>}
    </div>
  )
}
