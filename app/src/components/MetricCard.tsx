import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/Sparkline'
import type { Metric } from '@/lib/data'
import { TONE_CLS, delta, fmtVal, metaFor } from '@/lib/metrics'
import { cn, fmtTs } from '@/lib/utils'

export function MetricCard({
  k,
  metric,
  cur,
  prev,
  series,
  muted,
}: {
  k: string
  metric?: Metric
  cur: number | null
  prev: number | null
  series: (number | null)[]
  muted?: boolean
}) {
  const meta = metaFor(k)
  const d = delta(cur, prev, meta.kind)
  const src = metric?.source || (k.startsWith('@') ? 'X' : '—')
  return (
    <Card className={cn(muted && 'opacity-80')}>
      <CardContent className="flex h-full flex-col p-4">
        <div className="text-sm font-medium">{meta.label}</div>
        <div className="mt-0.5 min-h-[2rem] text-xs leading-snug text-muted-foreground">{meta.desc}</div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight">{fmtVal(cur, meta.kind)}</div>
          <div className="w-20 shrink-0">
            <Sparkline data={series} height={28} color={muted ? 'hsl(215 16% 57%)' : 'hsl(252 85% 68%)'} />
          </div>
        </div>
        <div className={cn('mt-1 font-mono text-xs font-medium', TONE_CLS[d.tone])}>
          {d.text}
          {d.tone !== 'none' && (
            <span className="ml-1 font-sans font-normal text-muted-foreground">
              {meta.hourly ? '较上一小时' : '较上期'}
            </span>
          )}
        </div>
        <div className="mt-auto pt-2 text-[11px] text-muted-foreground">
          {src}
          {metric?.fetched_at ? ` · ${fmtTs(metric.fetched_at).slice(5, 16)}` : ''}
          {metric?.cached ? ' · 沿用缓存' : ''}
        </div>
      </CardContent>
    </Card>
  )
}
