'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ChevronRight } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { isAdmin } = useCurrentUser();

  const visibleNavItems = NAV_ITEMS.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border/50 p-0">
        <div className="p-6">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg text-xl">
                    🌶️
                </div>
                {state === 'expanded' && (
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">SpiceRoute</h1>
                    <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Calicut Traders</p>
                </div>
                )}
            </div>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-4 space-y-1">
        {visibleNavItems.map(item => {
          if (item.isGroup) {
            return (
              <Collapsible key={item.title} defaultOpen className="group/collapsible mb-4">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground font-bold py-6">
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-4 mt-2 space-y-1">
                      {item.items?.map(subItem => (
                        <SidebarMenuItem key={subItem.href}>
                          <Link href={subItem.href} passHref>
                            <SidebarMenuButton
                              isActive={pathname === subItem.href}
                              className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground h-9 rounded-lg transition-colors"
                            >
                              <subItem.icon className="size-4" />
                              <span>{subItem.title}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.href} className="mb-1">
              <Link href={item.href!} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!))}
                  tooltip={item.title}
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-accent data-[active=true]:text-white h-11 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <item.icon className="size-5" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </>
  );
}
