'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { isAdmin } = useCurrentUser();

  const visibleNavItems = NAV_ITEMS.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <>
      <SidebarHeader className="border-b border-stone-200 p-0">
        <div className="p-4 bg-gradient-to-br from-spice-50 to-cardamom-50">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-spice-500 to-spice-600 flex items-center justify-center shadow-md text-white">
                    🌶️
                </div>
                {state === 'expanded' && (
                <div>
                    <h1 className="text-lg font-headline font-bold text-stone-900">SpiceRoute</h1>
                    <p className="text-xs text-stone-500">Export CRM</p>
                </div>
                )}
            </div>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-3">
        {visibleNavItems.map(item => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={{ children: item.title, className: "bg-stone-900 text-white border-stone-700" }}
                className="group-data-[[data-active=true]]:bg-gradient-to-r from-spice-500 to-spice-600 group-data-[[data-active=true]]:text-white group-data-[[data-active=true]]:shadow-md group-data-[[data-active=true]]:shadow-spice-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium"
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
