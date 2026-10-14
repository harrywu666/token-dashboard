import { useEffect, useState } from 'react'
import {
  Coins,
  LayoutDashboard,
  Activity,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { loadTokens, type TokenMeta } from '@/lib/data'

function currentTokenId(): string | null {
  const h = (window.location.hash || '#/').replace(/^#/, '')
  const m = h.match(/^\/?token\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [tokens, setTokens] = useState<TokenMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? currentTokenId() : null,
  )
  const isHome = !activeId

  useEffect(() => {
    loadTokens().then(setTokens)
  }, [])

  useEffect(() => {
    const onHash = () => setActiveId(currentTokenId())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href="#/" className="no-underline hover:no-underline" />}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">代币调查看板</span>
                <span className="truncate text-xs text-muted-foreground">Token Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isHome}
                  tooltip="概览"
                  render={<a href="#/" className="no-underline hover:no-underline" />}
                >
                  <Activity />
                  <span>调查概览</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>代币</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tokens.map((t) => (
                <SidebarMenuItem key={t.id}>
                  <SidebarMenuButton
                    isActive={activeId === t.id}
                    tooltip={t.name}
                    render={
                      <a
                        href={`#/token/${t.id}`}
                        className="no-underline hover:no-underline"
                      />
                    }
                  >
                    <Coins />
                    <span className="truncate">{t.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {!tokens.length && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground">暂无代币</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
          数据每小时更新，非秒级实时
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
