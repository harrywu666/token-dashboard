import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'

export function Sparkline({
  data,
  color = 'var(--chart-1)',
  height = 40,
}: {
  data: (number | null)[]
  color?: string
  height?: number
}) {
  const pts = data.map((v, i) => ({ i, v: v ?? undefined }))
  const nums = data.filter((v): v is number => v != null)
  if (nums.length < 2) {
    return <div className="h-10 w-full rounded bg-secondary/40" style={{ height }} />
  }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const pad = (max - min) * 0.1 || 1
  const lastIdx = (() => {
    for (let i = data.length - 1; i >= 0; i--) if (data[i] != null) return i
    return -1
  })()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={pts} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <YAxis domain={[min - pad, max + pad]} hide />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props
            if (index !== lastIdx || cx == null || cy == null) return <g key={index} />
            return <circle key={index} cx={cx} cy={cy} r={2.5} fill={color} />
          }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
