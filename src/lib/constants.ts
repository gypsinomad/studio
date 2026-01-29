import type { NavItem } from '@/lib/types';
import {
  LayoutDashboard,
  Sprout,
  Ship,
  Building2,
  Users,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
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
    icon: Building2,
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
    title: 'User Management',
    href: '/users',
    icon: Settings,
    adminOnly: true,
  },
];
