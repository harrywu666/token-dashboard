import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'

export function Sparkline({
  data,
  color = 'hsl(252 85% 68%)',
  height = 40,
}: {
  data: (number | null)[]
  color?: string
  height?: number
}) {
  const pts = data.map((v, i) => ({ i, v: v ?? undefined }))
  const nums = data.filter((v): v is number => v != null)
  if (nums.length < 2) {
    return <div className="h-10 w-full rounded bg-secondary/40" />
  }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const pad = (max - min) * 0.1 || 1
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={pts} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <YAxis domain={[min - pad, max + pad]} hide />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
