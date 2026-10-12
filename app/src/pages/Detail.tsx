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
import { TrendChart } from '@/components/TrendChart'
import {
  CH_LABEL,
  CH_VARIANT,
  LBL,
  followersSeries,
  loadPeriods,
  loadTokens,
  metricSeries,
  type Period,
  type TokenMeta,
} from '@/lib/data'
import { fmt, fmtTs, shortAddr, cn } from '@/lib/utils'

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

  const metricKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const p of periods) Object.keys(p.metrics || {}).forEach((k) => keys.add(k))
    // Primary first, mcap/liq last as secondary
    const order = [
      'holders',
      'top20_pct',
      'buys_1h',
      'sells_1h',
      'traders_1h',
      'new_buyers_1h',
      'platform_eth',
      'new_launches',
      'burns_24h',
    ]
    const primary = order.filter((k) => keys.has(k))
    const followers = [...keys].filter((k) => k.startsWith('@'))
    const secondary = ['mcap_usd', 'liq_usd'].filter((k) => keys.has(k))
    const rest = [...keys].filter(
      (k) => !primary.includes(k) && !secondary.includes(k) && !followers.includes(k),
    )
    return { primary: [...primary, ...followers, ...rest], secondary }
  }, [periods])

  const chartSeries = useMemo(() => {
    const series = [
      { key: 'holders', label: '持币地址', color: 'hsl(252 85% 68%)', data: metricSeries(periods, 'holders') },
      { key: 'top20', label: '前20占比%', color: 'hsl(152 69% 43%)', data: metricSeries(periods, 'top20_pct') },
    ]
    const f = followersSeries(periods)
    if (f.some((v) => v != null)) {
      series.push({ key: 'followers', label: '官推粉丝', color: 'hsl(36 90% 52%)', data: f })
    }
    return series
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
          <p className="text-sm text-muted-foreground">{token.chain} · {token.group_name}</p>
        </div>
        <div className="w-56">
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

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">核心指标</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricKeys.primary.map((k) => (
            <MetricCard key={k} label={LBL[k] || k} metric={period.metrics[k]} />
          ))}
        </div>
      </div>

      {metricKeys.secondary.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            参考（市值 / 流动性）
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metricKeys.secondary.map((k) => (
              <MetricCard key={k} label={LBL[k] || k} metric={period.metrics[k]} muted />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">走势</h2>
        <TrendChart labels={periods.map((p) => p.ts)} series={chartSeries} />
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
                        {w.delta_pct != null && w.delta_pct !== 0 ? ` ${w.delta_pct > 0 ? '+' : ''}${w.delta_pct}%` : ''}
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

function MetricCard({
  label,
  metric,
  muted,
}: {
  label: string
  metric?: { value: any; source: string; fetched_at: string; cached?: boolean }
  muted?: boolean
}) {
  return (
    <Card className={cn(muted && 'opacity-80')}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {fmt(metric?.value)}
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          {metric?.source || '—'}
          {metric?.fetched_at ? ` · ${fmtTs(metric.fetched_at).slice(5, 16)}` : ''}
          {metric?.cached ? ' · 沿用缓存' : ''}
        </div>
      </CardContent>
    </Card>
  )
}
