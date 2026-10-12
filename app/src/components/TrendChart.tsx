import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fmtTs } from '@/lib/utils'

type Series = { key: string; label: string; color: string; data: (number | null)[] }

export function TrendChart({ labels, series }: { labels: string[]; series: Series[] }) {
  const data = labels.map((ts, i) => {
    const row: Record<string, string | number | null> = { ts: fmtTs(ts).slice(5, 16) }
    for (const s of series) row[s.key] = s.data[i]
    return row
  })
  return (
    <div className="h-[280px] w-full rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(217 25% 16%)" strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: 'hsl(222 40% 9%)',
              border: '1px solid hsl(217 25% 16%)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              yAxisId={i === 0 ? 'left' : 'right'}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
