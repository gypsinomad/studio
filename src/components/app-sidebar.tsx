'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { NAV_ITEMS } from '@/lib/constants';
import { Sprout } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { MOCK_USERS } from '@/lib/data';

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  
  // In a real app, this would come from an auth context/hook
  const user: User | undefined = MOCK_USERS.find(u => u.role === 'admin');

  const visibleNavItems = NAV_ITEMS.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.role === 'admin')
  );

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Sprout className="h-6 w-6 text-primary" />
          </div>
          {state === 'expanded' && (
            <h1 className="text-xl font-semibold font-headline text-sidebar-foreground">
              SpiceRoute
            </h1>
          )}
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {visibleNavItems.map(item => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={{ children: item.title, className: "bg-sidebar-background text-sidebar-foreground border-sidebar-border" }}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}
