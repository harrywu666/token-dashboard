export type TokenMeta = {
  id: string
  name: string
  chain: string
  ca?: string
  group_name?: string
  x_accounts?: string[]
}

export type Metric = {
  value: number | string | null
  source: string
  fetched_at: string
  cached?: boolean
}

export type Top20Wallet = {
  addr: string
  pct: number | null
  change: string
  delta_pct: number | null
  link: string
}

export type Period = {
  ts: string
  conclusion: string[]
  metrics: Record<string, Metric>
  holders_delta: number | null
  top20: Top20Wallet[]
  excluded: { addr: string; reason: string }[]
  report_text: string
}

export const LBL: Record<string, string> = {
  new_buyers_1h: '1h首次买家',
  new_launches: '新发币',
  holders: '持币地址',
  mcap_usd: '市值(参考)',
  liq_usd: '流动性(参考)',
  top20_pct: '前20真人占比%',
  followers: '官推粉丝',
  buys_1h: '1h买入笔数',
  sells_1h: '1h卖出笔数',
  traders_1h: '1h独立交易钱包',
  burns_24h: '24h销毁',
  platform_eth: '平台税ETH(下限)',
}

export const CH_LABEL: Record<string, string> = {
  add: '加仓',
  reduce: '减仓',
  exit: '清仓',
  new: '新进',
  hold: '未动',
}

export const CH_VARIANT: Record<string, 'up' | 'down' | 'warn' | 'new' | 'muted'> = {
  add: 'up',
  reduce: 'warn',
  exit: 'down',
  new: 'new',
  hold: 'muted',
}

const j = async <T>(u: string): Promise<T | null> => {
  try {
    const r = await fetch(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now(), {
      cache: 'no-store',
    })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

/** Port of index.html norm() — adapts analyst flat schema to metrics map */
export function norm(x: any, chain: string): Period | null {
  if (!x) return null
  const S = x.sources || {}
  const m: Record<string, Metric> = {}
  const put = (k: string, v: any, sk?: string) => {
    const so = S[sk || k] || {}
    m[k] = {
      value: v ?? null,
      source: so.source || '',
      fetched_at: so.fetched_at || x.ts || '',
      cached: !!(x.x && x.x.cached_from && sk === 'x'),
    }
  }
  put('holders', x.holders)
  put('mcap_usd', x.mcap_usd)
  put('liq_usd', x.liquidity_usd, 'liquidity_usd')
  put('top20_pct', x.top20_total_pct, 'top20')
  const h = x.onchain_heat
  if (h) {
    put('buys_1h', h.buys, 'onchain_heat')
    put('sells_1h', h.sells, 'onchain_heat')
    put('traders_1h', h.unique_wallets, 'onchain_heat')
    put('new_buyers_1h', h.first_time_buyers, 'onchain_heat')
  }
  const pv = x.platform_volume
  if (pv) {
    put('platform_eth', pv.settled_eth_out, 'platform_volume')
    put('new_launches', pv.new_launches, 'platform_volume')
  }
  const f = (x.x || {}).followers || {}
  for (const [k, v] of Object.entries(f)) put('@' + k, v as any, 'x')

  const isSol = (chain || '').toLowerCase().includes('solana')
  const ex = isSol
    ? (a: string) => `https://gmgn.ai/sol/address/${a}`
    : (a: string) => `https://robinhoodchain.blockscout.com/address/${a}`
  const cm: Record<string, string> = { same: 'hold' }

  return {
    ts: x.ts,
    conclusion: x.conclusion || [],
    metrics: m,
    holders_delta: x.holders_delta ?? null,
    top20: (x.top20 || []).map((w: any) => ({
      addr: w.addr,
      pct: w.pct == null ? null : +(+w.pct).toFixed(2),
      change: cm[w.change] || w.change || 'hold',
      delta_pct: w.delta_pct ?? null,
      link: ex(w.addr),
    })),
    excluded: x.excluded || [],
    report_text: x.report_text || '',
  }
}

export async function loadTokens(): Promise<TokenMeta[]> {
  return (await j<TokenMeta[]>('data/tokens.json')) || []
}

export async function loadPeriods(id: string, chain: string): Promise<Period[]> {
  const raw = (await j<any[]>(`data/${id}/issues.json`)) || []
  return raw.map((r) => norm(r, chain)).filter(Boolean) as Period[]
}

export function metricSeries(periods: Period[], key: string): (number | null)[] {
  return periods.map((p) => {
    const v = p.metrics?.[key]?.value
    return typeof v === 'number' ? v : v == null ? null : Number(v)
  })
}

/** Prefer official first follower account as "followers" series */
export function followersSeries(periods: Period[]): (number | null)[] {
  return periods.map((p) => {
    const keys = Object.keys(p.metrics || {}).filter((k) => k.startsWith('@'))
    if (!keys.length) return null
    const v = p.metrics[keys[0]]?.value
    return typeof v === 'number' ? v : null
  })
}
