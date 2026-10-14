import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SeriesPanel, type SeriesPoint } from '@/components/SeriesPanel'
import { MetricCard } from '@/components/MetricCard'
import { SECTIONS, valueAt, type Kind } from '@/lib/metrics'
import {
  CH_LABEL,
  CH_VARIANT,
  followersSeries,
  loadPeriods,
  loadTokens,
  metricSeries,
  type Period,
  type TokenMeta,
} from '@/lib/data'
import { fmtTs, shortAddr } from '@/lib/utils'

const PANEL_COLORS: Record<string, string> = {
  holders: 'hsl(252 85% 68%)',
  top20_pct: 'hsl(152 69% 43%)',
  mcap_usd: 'hsl(36 90% 52%)',
  liq_usd: 'hsl(210 90% 60%)',
  followers: 'hsl(280 70% 60%)',
  buys_1h: 'hsl(152 69% 43%)',
  sells_1h: 'hsl(0 72% 55%)',
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

export function Detail({ id }: { id: string }) {
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
    const push = (key: string, title: string, kind: Kind, values: (number | null)[], color?: string) => {
      const points = buildPoints(periods, values)
      if (!hasEnough(points)) return
      out.push({
        key,
        title,
        kind,
        color: color || PANEL_COLORS[key] || 'hsl(252 85% 68%)',
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

  if (loading) return <div className="text-muted-foreground">加载中…</div>
  if (!token || !period) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <a href="#/">
            <ArrowLeft className="h-4 w-4" /> 返回
          </a>
        </Button>
        <div className="text-muted-foreground">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <a href="#/" className="no-underline">
              <ArrowLeft className="h-4 w-4" /> 返回概览
            </a>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{token.name}</h1>
          <p className="text-sm text-muted-foreground">
            {token.chain} · {token.group_name}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-1 text-xs text-muted-foreground">期次</div>
          <Select value={String(idx)} onValueChange={(v) => setIdx(+v)}>
            <SelectTrigger>
              <SelectValue />
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
      </div>

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

      {SECTIONS.map((sec) => {
        const keys = sec.keys(allKeys)
        if (!keys.length) return null
        const muted = sec.title.startsWith('参考')
        return (
          <div key={sec.title}>
            <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground">{sec.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {keys.map((k) => (
                <MetricCard
                  key={k}
                  k={k}
                  metric={period.metrics[k]}
                  cur={valueAt(periods, idx, k)}
                  prev={valueAt(periods, idx - 1, k)}
                  series={periods.slice(0, idx + 1).map((_, i) => valueAt(periods, i, k))}
                  muted={muted}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground">走势看板</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          一手指标序列（GMGN / 链上 / X），缺数期断点不连；区间按期次条数切换。
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {panels.map((p) => (
            <SeriesPanel
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

      <Tabs defaultValue="top20">
        <TabsList>
          <TabsTrigger value="top20">前 20 真人钱包</TabsTrigger>
          <TabsTrigger value="excluded">已剔除</TabsTrigger>
          <TabsTrigger value="report">简报原文</TabsTrigger>
        </TabsList>
        <TabsContent value="top20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>地址</TableHead>
                <TableHead className="text-right">占比%</TableHead>
                <TableHead>变化</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(period.top20 || []).map((w, i) => {
                const variant = CH_VARIANT[w.change] || 'muted'
                const border =
                  w.change === 'add'
                    ? 'border-l-2 border-l-up'
                    : w.change === 'reduce'
                      ? 'border-l-2 border-l-warn'
                      : w.change === 'exit'
                        ? 'border-l-2 border-l-down'
                        : w.change === 'new'
                          ? 'border-l-2 border-l-new'
                          : ''
                return (
                  <TableRow key={w.addr + i} className={border}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <a href={w.link} target="_blank" rel="noreferrer" className="no-underline hover:underline">
                        {shortAddr(w.addr)}
                      </a>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{w.pct ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={variant}>
                        {CH_LABEL[w.change] || w.change || '未动'}
                        {w.delta_pct != null && w.delta_pct !== 0
                          ? ` ${w.delta_pct > 0 ? '+' : ''}${w.delta_pct}%`
                          : ''}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!period.top20?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="excluded">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地址</TableHead>
                <TableHead>原因</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(period.excluded || []).map((e, i) => (
                <TableRow key={e.addr + i}>
                  <TableCell>{shortAddr(e.addr)}</TableCell>
                  <TableCell className="font-sans text-muted-foreground">{e.reason}</TableCell>
                </TableRow>
              ))}
              {!period.excluded?.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="report">
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            {period.report_text || '—'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}
