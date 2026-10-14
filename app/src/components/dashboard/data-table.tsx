import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CH_LABEL, CH_VARIANT, type Top20Wallet } from '@/lib/data'
import { shortAddr } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Top20DataTable({
  rows,
}: {
  rows: Top20Wallet[]
}) {
  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-[520px]">
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="sticky left-0 z-[1] bg-muted/50 min-w-[140px]">
                  地址
                </TableHead>
                <TableHead className="text-right">占比%</TableHead>
                <TableHead>变化</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w, i) => {
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
                    <TableCell className="text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="sticky left-0 bg-card font-mono text-sm">
                      <a
                        href={w.link}
                        target="_blank"
                        rel="noreferrer"
                        className="no-underline hover:underline"
                      >
                        {shortAddr(w.addr)}
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {w.pct ?? '—'}
                    </TableCell>
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
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export function ExcludedTable({
  rows,
}: {
  rows: { addr: string; reason: string }[]
}) {
  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-[420px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">地址</TableHead>
                <TableHead>原因</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e, i) => (
                <TableRow key={e.addr + i}>
                  <TableCell className={cn('sticky left-0 bg-card font-mono')}>
                    {shortAddr(e.addr)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.reason}</TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
