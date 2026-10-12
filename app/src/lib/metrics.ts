import type { Period } from './data'

export type Kind = 'count' | 'pct' | 'usd' | 'eth'
export type MetaDef = { label: string; desc: string; kind: Kind; hourly?: boolean }

export const META: Record<string, MetaDef> = {
  holders: { label: '持币地址', desc: '持有该代币的钱包数，主看指标', kind: 'count' },
  top20_pct: { label: '前20真人占比', desc: '剔除池子/交易所/销毁/项目方后，前20大钱包合计占比', kind: 'pct' },
  buys_1h: { label: '1h买入笔数', desc: '过去1小时链上swap买入笔数（不含机器人路由，偏保守）', kind: 'count', hourly: true },
  sells_1h: { label: '1h卖出笔数', desc: '过去1小时链上swap卖出笔数（不含机器人路由，偏保守）', kind: 'count', hourly: true },
  traders_1h: { label: '1h独立交易钱包', desc: '过去1小时有买卖的不同钱包数', kind: 'count', hourly: true },
  new_buyers_1h: { label: '1h首次买家', desc: '此前未在记录中出现过的买入钱包', kind: 'count', hourly: true },
  platform_eth: { label: '平台税ETH(下限)', desc: '过去1小时 feeRouter 结算流出的ETH，只算得到的部分，是下限', kind: 'eth', hourly: true },
  new_launches: { label: '1h新发币', desc: '过去1小时平台上新发行的代币数', kind: 'count', hourly: true },
  burns_24h: { label: '24h销毁', desc: '过去24小时销毁的代币数量', kind: 'count' },
  mcap_usd: { label: '市值', desc: '仅参考，不作为判断依据', kind: 'usd' },
  liq_usd: { label: '流动性', desc: '仅参考，池子内可交易的资金规模', kind: 'usd' },
}

export function metaFor(k: string): MetaDef {
  if (k.startsWith('@')) return { label: `${k} 粉丝`, desc: 'X 账号粉丝数，看关注度是否在涨', kind: 'count' }
  return META[k] || { label: k, desc: '', kind: 'count' }
}

export const SECTIONS: { title: string; keys: (all: string[]) => string[] }[] = [
  { title: '持币结构', keys: (a) => ['holders', 'top20_pct', 'burns_24h'].filter((k) => a.includes(k)) },
  {
    title: '链上热度（1h）',
    keys: (a) => ['buys_1h', 'sells_1h', 'traders_1h', 'new_buyers_1h', 'platform_eth', 'new_launches'].filter((k) => a.includes(k)),
  },
  { title: '官推粉丝', keys: (a) => a.filter((k) => k.startsWith('@')) },
  { title: '参考（不作判断依据）', keys: (a) => ['mcap_usd', 'liq_usd'].filter((k) => a.includes(k)) },
]

const num = (v: unknown): number | null => (typeof v === 'number' && !Number.isNaN(v) ? v : null)

export function valueAt(periods: Period[], i: number, k: string): number | null {
  return i < 0 ? null : num(periods[i]?.metrics?.[k]?.value)
}

export function fmtUsd(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
  if (a >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
  if (a >= 1e3) return `$${(v / 1e3).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

export function fmtVal(v: number | null, kind: Kind): string {
  if (v == null) return '—'
  if (kind === 'pct') return `${v.toFixed(2)}%`
  if (kind === 'usd') return fmtUsd(v)
  if (kind === 'eth') return `${v.toFixed(4)} ETH`
  return Math.round(v).toLocaleString('en-US')
}

export type Delta = { text: string; tone: 'up' | 'down' | 'flat' | 'none' }

export function delta(cur: number | null, prev: number | null, kind: Kind): Delta {
  if (cur == null || prev == null) return { text: '无上期', tone: 'none' }
  const d = cur - prev
  const eps = kind === 'pct' ? 0.005 : kind === 'eth' ? 1e-6 : 0.5
  if (Math.abs(d) < eps) return { text: '持平', tone: 'flat' }
  const arrow = d > 0 ? '▲' : '▼'
  const sign = d > 0 ? '+' : '−'
  const ad = Math.abs(d)
  let text: string
  if (kind === 'pct') text = `${arrow} ${sign}${ad.toFixed(2)}pp`
  else if (kind === 'usd') text = `${arrow} ${sign}${fmtUsd(ad)}${prev ? ` (${sign}${((ad / Math.abs(prev)) * 100).toFixed(1)}%)` : ''}`
  else if (kind === 'eth') text = `${arrow} ${sign}${ad.toFixed(4)}`
  else text = `${arrow} ${sign}${Math.round(ad).toLocaleString('en-US')}${prev ? ` (${sign}${((ad / Math.abs(prev)) * 100).toFixed(1)}%)` : ''}`
  return { text, tone: d > 0 ? 'up' : 'down' }
}

export const TONE_CLS: Record<Delta['tone'], string> = {
  up: 'text-up',
  down: 'text-down',
  flat: 'text-muted-foreground',
  none: 'text-muted-foreground/70',
}
