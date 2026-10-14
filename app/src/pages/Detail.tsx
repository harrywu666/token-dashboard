import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SiteHeader } from '@/components/dashboard/site-header'
import { SectionCard, SectionCardsGrid } from '@/components/dashboard/section-cards'
import {
  ChartAreaInteractive,
  type SeriesPoint,
} from '@/components/dashboard/chart-area-interactive'
import { ExcludedTable, Top20DataTable } from '@/components/dashboard/data-table'
import { SECTIONS, valueAt, type Kind } from '@/lib/metrics'
import {
  followersSeries,
  loadPeriods,
  loadTokens,
  metricSeries,
  type Period,
  type TokenMeta,
} from '@/lib/data'
import { fmtTs } from '@/lib/utils'

const PANEL_COLORS: Record<string, string> = {
  holders: 'oklch(0.7 0.16 285)',
  top20_pct: 'oklch(0.68 0.17 155)',
  mcap_usd: 'oklch(0.78 0.15 70)',
  liq_usd: 'oklch(0.7 0.14 240)',
  followers: 'oklch(0.72 0.14 310)',
  buys_1h: 'oklch(0.68 0.17 155)',
  sells_1h: 'oklch(0.63 0.22 25)',
}

type PanelDef = {
  key: string
  title: string
  kind: Kind
  color: string
  points: SeriesPoint[]
}

function buildPoints(periods: Period[], values: (number | null)[]): SeriesPoint[] {
  return periods.map((p, i) => ({
    ts: p.ts,
    value: values[i] ?? null,
  }))
}

function hasEnough(points: SeriesPoint[]): boolean {
  return points.some((p) => p.value != null)
}

export function Detail({ id, clock }: { id: string; clock?: string }) {
  const [token, setToken] = useState<TokenMeta | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [idx, setIdx] = useState(-1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const tokens = await loadTokens()
      const t = tokens.find((x) => x.id === id) || null
      const ps = t ? await loadPeriods(id, t.chain) : []
      if (cancelled) return
      setToken(t)
      setPeriods(ps)
      setIdx(ps.length ? ps.length - 1 : -1)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const period = idx >= 0 ? periods[idx] : null

  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const p of periods) Object.keys(p.metrics || {}).forEach((k) => keys.add(k))
    return [...keys]
  }, [periods])

  const panels = useMemo((): PanelDef[] => {
    const out: PanelDef[] = []
    const push = (
      key: string,
      title: string,
      kind: Kind,
      values: (number | null)[],
      color?: string,
    ) => {
      const points = buildPoints(periods, values)
      if (!hasEnough(points)) return
      out.push({
        key,
        title,
        kind,
        color: color || PANEL_COLORS[key] || 'oklch(0.7 0.16 285)',
        points,
      })
    }

    push('holders', '持币地址', 'count', metricSeries(periods, 'holders'))
    push('top20_pct', '前20真人占比 %', 'pct', metricSeries(periods, 'top20_pct'))
    push('mcap_usd', '市值 (USD)', 'usd', metricSeries(periods, 'mcap_usd'))
    push('liq_usd', '流动性 (USD)', 'usd', metricSeries(periods, 'liq_usd'))

    const fol = followersSeries(periods)
    if (fol.some((v) => v != null)) {
      const handle =
        periods
          .map((p) => Object.keys(p.metrics || {}).find((k) => k.startsWith('@')))
          .find(Boolean) || '@官推'
      push('followers', `${handle} 粉丝`, 'count', fol, PANEL_COLORS.followers)
    }

    push('buys_1h', '1h 买入笔数', 'count', metricSeries(periods, 'buys_1h'), PANEL_COLORS.buys_1h)
    push('sells_1h', '1h 卖出笔数', 'count', metricSeries(periods, 'sells_1h'), PANEL_COLORS.sells_1h)

    return out
  }, [periods])

  const periodSelect =
    periods.length > 0 ? (
      <div className="w-40 sm:w-52">
        <Select value={String(idx)} onValueChange={(v) => setIdx(+v)}>
          <SelectTrigger aria-label="选择期次">
            <SelectValue placeholder="期次" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p, i) => (
              <SelectItem key={p.ts + i} value={String(i)}>
                {fmtTs(p.ts)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null

  if (loading) {
    return (
      <>
        <SiteHeader title="加载中…" clock={clock} />
        <div className="px-4 py-6 text-muted-foreground lg:px-6">加载中…</div>
      </>
    )
  }

  if (!token || !period) {
    return (
      <>
        <SiteHeader title="暂无数据" clock={clock} />
        <div className="px-4 py-6 text-muted-foreground lg:px-6">暂无数据</div>
      </>
    )
  }

  return (
    <>
      <SiteHeader
        title={token.name}
        subtitle={`${token.chain} · ${token.group_name || token.id}`}
        actions={periodSelect}
        clock={clock}
      />
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>本期结论</CardTitle>
            </CardHeader>
            <CardContent>
              {(period.conclusion || []).length ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  {period.conclusion.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground">—</div>
              )}
            </CardContent>
          </Card>
        </div>

        {SECTIONS.map((sec) => {
          const keys = sec.keys(allKeys)
          if (!keys.length) return null
          const muted = sec.title.startsWith('参考')
          return (
            <div key={sec.title} className="space-y-3">
              <h2 className="px-4 text-sm font-semibold tracking-wider text-muted-foreground lg:px-6">
                {sec.title}
              </h2>
              <SectionCardsGrid>
                {keys.map((k) => (
                  <SectionCard
                    key={k}
                    k={k}
                    metric={period.metrics[k]}
                    cur={valueAt(periods, idx, k)}
                    prev={valueAt(periods, idx - 1, k)}
                    series={periods.slice(0, idx + 1).map((_, i) => valueAt(periods, i, k))}
                    muted={muted}
                  />
                ))}
              </SectionCardsGrid>
            </div>
          )
        })}

        <div className="space-y-3">
          <div className="px-4 lg:px-6">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground">
              走势看板
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              一手指标序列（GMGN / 链上 / X），缺数期断点不连；区间按期次条数切换。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 xl:grid-cols-2 lg:px-6">
            {panels.map((p) => (
              <ChartAreaInteractive
                key={p.key}
                title={p.title}
                kind={p.kind}
                color={p.color}
                points={p.points}
                defaultRange={periods.length > 24 ? '24' : 'all'}
              />
            ))}
            {!panels.length && (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                暂无可用走势序列
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Tabs defaultValue="top20" className="px-0">
            <div className="px-4 lg:px-6">
              <TabsList>
                <TabsTrigger value="top20">前 20 真人钱包</TabsTrigger>
                <TabsTrigger value="excluded">已剔除</TabsTrigger>
                <TabsTrigger value="report">简报原文</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="top20" className="mt-3">
              <Top20DataTable rows={period.top20 || []} />
            </TabsContent>
            <TabsContent value="excluded" className="mt-3">
              <ExcludedTable rows={period.excluded || []} />
            </TabsContent>
            <TabsContent value="report" className="mt-3 px-4 lg:px-6">
              <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
                {period.report_text || '—'}
              </pre>
            </TabsContent>
          </Tabs>
        </div>

        <footer className="px-4 pb-4 text-center text-xs text-muted-foreground lg:px-6">
          数据每小时更新，非秒级实时 · 有新版本会自动刷新
        </footer>
      </div>
    </>
  )
}
