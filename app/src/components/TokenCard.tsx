import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkline } from '@/components/Sparkline'
import type { Period, TokenMeta } from '@/lib/data'
import { metricSeries } from '@/lib/data'
import { fmt, fmtDelta, fmtTs, cn } from '@/lib/utils'

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
      <Card className="group transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg group-hover:text-primary">{token.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{token.chain}</p>
          </div>
          <Badge variant="secondary">{token.group_name || token.id}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricMini
              label="持币地址"
              value={fmt(holders)}
              delta={delta}
              spark={holdersSpark}
              color="hsl(252 85% 68%)"
            />
            <MetricMini
              label="前20真人占比"
              value={top20 == null ? '—' : `${Number(top20).toFixed(2)}%`}
              spark={top20Spark}
              color="hsl(152 69% 43%)"
            />
            <MetricMini
              label="1h买入"
              value={fmt(buys)}
              spark={buysSpark}
              color="hsl(152 69% 43%)"
            />
            <MetricMini
              label="1h卖出"
              value={fmt(sells)}
              spark={sellsSpark}
              color="hsl(0 72% 55%)"
            />
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

function MetricMini({
  label,
  value,
  delta,
  spark,
  color,
}: {
  label: string
  value: string
  delta?: number | null
  spark: (number | null)[]
  color: string
}) {
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight">{value}</div>
      {delta != null && (
        <div
          className={cn(
            'text-xs font-medium',
            delta > 0 ? 'text-up' : delta < 0 ? 'text-down' : 'text-muted-foreground',
          )}
        >
          {fmtDelta(delta)} 较上期
        </div>
      )}
      <div className="mt-1">
        <Sparkline data={spark} color={color} height={32} />
      </div>
    </div>
  )
}
