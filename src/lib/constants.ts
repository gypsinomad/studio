import type { NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Sprout,
  Ship,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  Building,
} from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Sprout,
  },
  {
    title: 'Export Orders',
    href: '/export-orders',
    icon: Ship,
  },
  {
    title: 'Companies',
    href: '/companies',
    icon: Building,
  },
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Admin Settings',
    href: '/users',
    icon: Settings,
    adminOnly: true,
  },
];
