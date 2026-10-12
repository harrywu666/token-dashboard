import { Activity, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Layout({
  children,
  clock,
}: {
  children: React.ReactNode
  clock?: string
}) {
  const hash = typeof window !== 'undefined' ? window.location.hash : '#/'
  const home = !hash || hash === '#' || hash === '#/'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
          <a
            href="#/"
            className="flex items-center gap-2.5 font-semibold text-foreground no-underline hover:no-underline"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-up">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </span>
            代币调查看板
          </a>
          <nav className="flex items-center gap-1 text-sm">
            <a
              href="#/"
              className={cn(
                'rounded-md px-3 py-1.5 no-underline transition-colors',
                home ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              概览
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-up" />
            <span>{clock || '—'}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  )
}
