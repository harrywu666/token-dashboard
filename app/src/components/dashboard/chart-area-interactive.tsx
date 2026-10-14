import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Kind } from '@/lib/metrics'
import { fmtVal, TONE_CLS } from '@/lib/metrics'
import { cn, fmtTs } from '@/lib/utils'

export type SeriesPoint = { ts: string; value: number | null }

type RangeKey = 'all' | '24' | '12'

const RANGES: { key: RangeKey; label: string; n?: number }[] = [
  { key: 'all', label: '全部' },
  { key: '24', label: '近24期', n: 24 },
  { key: '12', label: '近12期', n: 12 },
]

function axisFmt(v: number, kind: Kind): string {
  if (kind === 'pct') return `${v.toFixed(1)}%`
  if (kind === 'usd') {
    const a = Math.abs(v)
    if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
    if (a >= 1e3) return `$${(v / 1e3).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }
  if (kind === 'eth') return v.toFixed(3)
  const a = Math.abs(v)
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return Math.round(v).toLocaleString('en-US')
}

function xLabel(ts: string): string {
  const s = fmtTs(ts)
  return s.length >= 16 ? s.slice(5, 16) : s
}

function yDomain(nums: number[], kind: Kind): [number, number] | ['auto', 'auto'] {
  if (!nums.length) return ['auto', 'auto']
  if (kind === 'pct') {
    const lo = Math.max(0, Math.min(...nums) - 1)
    const hi = Math.min(100, Math.max(...nums) + 1)
    return [lo, hi]
  }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min
  const pad = span === 0 ? Math.max(Math.abs(max) * 0.05, 1) : span * 0.12
  let lo = min - pad
  if (min >= 0 && lo < 0) lo = 0
  return [lo, max + pad]
}

function summary(points: SeriesPoint[], kind: Kind) {
  const nums = points.map((p) => p.value).filter((v): v is number => v != null)
  const missing = points.length - nums.length
  if (!nums.length) {
    return {
      latest: null as number | null,
      changeAbs: null as number | null,
      changePct: null as number | null,
      min: null as number | null,
      max: null as number | null,
      missing,
      tone: 'none' as const,
    }
  }
  let latest: number | null = null
  let first: number | null = null
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value != null) {
      latest = points[i].value
      break
    }
  }
  for (let i = 0; i < points.length; i++) {
    if (points[i].value != null) {
      first = points[i].value
      break
    }
  }
  const changeAbs = latest != null && first != null ? latest - first : null
  const changePct =
    changeAbs != null && first != null && first !== 0 ? (changeAbs / Math.abs(first)) * 100 : null
  let tone: 'up' | 'down' | 'flat' | 'none' = 'none'
  if (changeAbs != null) {
    const eps = kind === 'pct' ? 0.005 : kind === 'eth' ? 1e-6 : 0.5
    if (Math.abs(changeAbs) < eps) tone = 'flat'
    else tone = changeAbs > 0 ? 'up' : 'down'
  }
  return {
    latest,
    changeAbs,
    changePct,
    min: Math.min(...nums),
    max: Math.max(...nums),
    missing,
    tone,
  }
}

export function ChartAreaInteractive({
  title,
  kind,
  color = 'var(--chart-1)',
  points,
  defaultRange = 'all',
}: {
  title: string
  kind: Kind
  color?: string
  points: SeriesPoint[]
  defaultRange?: RangeKey
}) {
  const [range, setRange] = useState<RangeKey>(defaultRange)
  const gradId = useMemo(() => `grad-${title.replace(/\W+/g, '')}-${kind}`, [title, kind])

  const visible = useMemo(() => {
    const n = RANGES.find((r) => r.key === range)?.n
    if (!n || points.length <= n) return points
    return points.slice(-n)
  }, [points, range])

  const chartData = useMemo(
    () =>
      visible.map((p) => ({
        ts: p.ts,
        label: xLabel(p.ts),
        v: p.value,
      })),
    [visible],
  )

  const nums = useMemo(
    () => chartData.map((d) => d.v).filter((v): v is number => v != null),
    [chartData],
  )
  const domain = yDomain(nums, kind)
  const s = summary(visible, kind)
  const hasAny = nums.length > 0

  const changeText = (() => {
    if (s.changeAbs == null) return '—'
    if (s.tone === 'flat') return '持平'
    const sign = s.changeAbs > 0 ? '+' : '−'
    const ad = Math.abs(s.changeAbs)
    let abs: string
    if (kind === 'pct') abs = `${sign}${ad.toFixed(2)}pp`
    else if (kind === 'usd') abs = `${sign}${fmtVal(ad, 'usd')}`
    else if (kind === 'eth') abs = `${sign}${ad.toFixed(4)}`
    else abs = `${sign}${Math.round(ad).toLocaleString('en-US')}`
    const pct =
      s.changePct != null && kind !== 'pct'
        ? ` (${sign}${Math.abs(s.changePct).toFixed(1)}%)`
        : ''
    return `${s.changeAbs > 0 ? '▲' : '▼'} ${abs}${pct}`
  })()

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {s.missing > 0 && hasAny
            ? `部分期次缺数（${s.missing} 期），断点不连线`
            : hasAny
              ? '区间最新 / 涨跌 / 最低 / 最高'
              : '所选区间暂无数据'}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            value={[range]}
            onValueChange={(v) => {
              if (v[0]) setRange(v[0] as RangeKey)
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[540px]/card:flex"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem key={r.key} value={r.key}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="flex w-28 @[540px]/card:hidden" aria-label="选择区间">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {RANGES.map((r) => (
                <SelectItem key={r.key} value={r.key} className="rounded-lg">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3 px-4 pb-2 sm:grid-cols-4 lg:px-6">
        <div>
          <div className="text-sm text-muted-foreground">最新</div>
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {fmtVal(s.latest, kind)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">区间涨跌</div>
          <div className={cn('font-mono text-sm font-medium tabular-nums sm:text-base', TONE_CLS[s.tone])}>
            {changeText}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">区间最低</div>
          <div className="font-mono text-sm tabular-nums sm:text-base">{fmtVal(s.min, kind)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">区间最高</div>
          <div className="font-mono text-sm tabular-nums sm:text-base">{fmtVal(s.max, kind)}</div>
        </div>
      </div>

      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        <div className="aspect-auto h-[250px] w-full min-w-0 overflow-x-auto">
          <div className="h-full min-w-[280px]">
            {hasAny ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    minTickGap={36}
                    interval="preserveStartEnd"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={domain}
                    tickFormatter={(v: number) => axisFmt(v, kind)}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0]?.payload as { ts: string; v: number | null }
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <div className="mb-1 text-muted-foreground">{fmtTs(row.ts)}</div>
                          <div className="font-mono text-sm font-semibold tabular-nums">
                            {fmtVal(row.v, kind)}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="none"
                    fill={`url(#${gradId})`}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                暂无可用数据点
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
