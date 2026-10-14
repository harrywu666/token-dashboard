import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Sparkline } from '@/components/Sparkline'
import type { Metric } from '@/lib/data'
import { TONE_CLS, delta, fmtVal, metaFor } from '@/lib/metrics'
import { cn, fmtTs } from '@/lib/utils'

export function SectionCard({
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
  const TrendIcon = d.tone === 'up' ? TrendingUp : d.tone === 'down' ? TrendingDown : Minus

  return (
    <Card className={cn('@container/card', muted && 'opacity-80')}>
      <CardHeader>
        <CardDescription>{meta.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {fmtVal(cur, meta.kind)}
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className={cn('gap-1 font-mono tabular-nums', TONE_CLS[d.tone])}
          >
            <TrendIcon className="size-3.5" />
            {d.text}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex w-full items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {meta.desc || '—'}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {src}
              {metric?.fetched_at ? ` · ${fmtTs(metric.fetched_at).slice(5, 16)}` : ''}
              {metric?.cached ? ' · 沿用缓存' : ''}
              {d.tone !== 'none' ? (
                <span> · {meta.hourly ? '较上一小时' : '较上期'}</span>
              ) : null}
            </div>
          </div>
          <div className="w-20 shrink-0">
            <Sparkline
              data={series}
              height={28}
              color={muted ? 'oklch(0.68 0.02 250)' : 'oklch(0.7 0.16 285)'}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCardsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {children}
    </div>
  )
}
