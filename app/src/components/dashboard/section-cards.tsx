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
            className={cn('gap-1 font-normal tabular-nums', TONE_CLS[d.tone])}
          >
            <TrendIcon className="size-3.5" />
            {d.text}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="flex w-full items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {d.tone !== 'none' ? (
                <>
                  {meta.hourly ? '较上一小时' : '较上期'}
                  <TrendIcon className="size-4 shrink-0" />
                </>
              ) : (
                <span className="text-muted-foreground">无上期对比</span>
              )}
            </div>
            <div className="text-muted-foreground">
              {meta.desc || '—'}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {src}
              {metric?.fetched_at ? ` · ${fmtTs(metric.fetched_at).slice(5, 16)}` : ''}
              {metric?.cached ? ' · 沿用缓存' : ''}
            </div>
          </div>
          <div className="w-20 shrink-0">
            <Sparkline
              data={series}
              height={28}
              color={muted ? 'var(--muted-foreground)' : 'var(--chart-1)'}
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
