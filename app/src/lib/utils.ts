import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(v: number | string | null | undefined): string {
  if (v == null || Number.isNaN(v as number)) return '—'
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M'
    if (Math.abs(v) >= 1e4) return v.toLocaleString('en-US')
    if (Math.abs(v) < 1 && Math.abs(v) > 0) return v.toFixed(4)
    return Number.isInteger(v) ? String(v) : v.toFixed(2)
  }
  return String(v)
}

export function fmtDelta(d: number | null | undefined): string {
  if (d == null) return ''
  return (d >= 0 ? '+' : '') + d
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || '—'
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export function fmtTs(ts?: string): string {
  if (!ts) return '—'
  return ts.replace('T', ' ').replace('+08:00', '')
}
