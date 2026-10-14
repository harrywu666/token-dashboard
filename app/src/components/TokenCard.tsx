import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkline } from '@/components/Sparkline'
import type { Period, TokenMeta } from '@/lib/data'
import { metricSeries } from '@/lib/data'
import { fmtTs, cn } from '@/lib/utils'
import { TONE_CLS, delta as mkDelta, fmtVal, valueAt, type Kind } from '@/lib/metrics'

export function TokenCard({
  token,
  periods,
}: {
  token: TokenMeta
  periods: Period[]
}) {
  const latest = periods.at(-1)
  const prev = periods.at(-2)
  const holders = latest?.metrics?.holders?.value as number | null | undefined
  const holdersPrev = prev?.metrics?.holders?.value as number | null | undefined
  const delta =
    latest?.holders_delta ??
    (holders != null && holdersPrev != null ? holders - holdersPrev : null)
  const top20 = latest?.metrics?.top20_pct?.value as number | null | undefined
  const buys = latest?.metrics?.buys_1h?.value as number | null | undefined
  const sells = latest?.metrics?.sells_1h?.value as number | null | undefined
  const conclusions = (latest?.conclusion || []).slice(0, 2)
  const src = latest?.metrics?.holders

  const holdersSpark = metricSeries(periods, 'holders')
  const top20Spark = metricSeries(periods, 'top20_pct')
  const buysSpark = metricSeries(periods, 'buys_1h')
  const sellsSpark = metricSeries(periods, 'sells_1h')

  return (
    <a href={`#/token/${token.id}`} className="block no-underline hover:no-underline">
      <Card className="group transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base font-semibold group-hover:text-primary">{token.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{token.chain}</p>
          </div>
          <Badge variant="secondary">{token.group_name || token.id}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['holders', '持币地址', 'count', holdersSpark, 'var(--chart-1)', false],
              ['top20_pct', '前20真人占比', 'pct', top20Spark, 'var(--chart-2)', false],
              ['buys_1h', '1h买入', 'count', buysSpark, 'var(--chart-2)', true],
              ['sells_1h', '1h卖出', 'count', sellsSpark, 'var(--chart-5)', true],
            ] as [string, string, Kind, (number | null)[], string, boolean][]).map(([k, label, kind, spark, color, hourly]) => {
              const n = periods.length - 1
              const cur = valueAt(periods, n, k)
              const d = mkDelta(cur, valueAt(periods, n - 1, k), kind)
              return (
                <div key={k} className="min-w-0 overflow-hidden rounded-lg bg-secondary/40 p-2.5">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">{fmtVal(cur, kind)}</div>
                  <div className={cn('text-xs font-medium', TONE_CLS[d.tone])}>
                    {d.text}
                    {d.tone !== 'none' && <span className="block font-sans font-normal text-muted-foreground">{hourly ? '较上一小时' : '较上期'}</span>}
                  </div>
                  <div className="mt-1"><Sparkline data={spark} color={color} height={32} /></div>
                </div>
              )
            })}
          </div>

          {conclusions.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
              {conclusions.map((c, i) => (
                <li key={i} className="line-clamp-2">
                  · {c}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>更新 {fmtTs(latest?.ts)}</span>
            {src?.source && (
              <>
                <span>·</span>
                <span>
                  {src.source}
                  {src.fetched_at ? ` · ${fmtTs(src.fetched_at).slice(5)}` : ''}
                  {src.cached ? ' · 沿用缓存' : ''}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

