'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="p-4 bg-primary">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-md text-white">
                    🌶️
                </div>
                {state === 'expanded' && (
                <div>
                    <h1 className="text-lg font-bold text-white">SpiceRoute</h1>
                    <p className="text-xs text-white/70">Export CRM</p>
                </div>
                )}
            </div>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-3">
        {visibleNavItems.map(item => {
          if (item.isGroup) {
            return (
              <Collapsible key={item.title} defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="text-sidebar-foreground hover:bg-sidebar-accent">
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="pl-4 mt-1 space-y-1">
                      {item.items?.map(subItem => (
                        <SidebarMenuItem key={subItem.href}>
                          <Link href={subItem.href} passHref>
                            <SidebarMenuButton
                              isActive={pathname === subItem.href}
                              className="text-sidebar-foreground/80 hover:bg-sidebar-accent h-8"
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
            <SidebarMenuItem key={item.href}>
              <Link href={item.href!} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!))}
                  tooltip={item.title}
                  className="text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-accent data-[active=true]:text-white"
                >
                  <item.icon />
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