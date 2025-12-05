'use client';

/**
 * AppSidebar - Vertical Navigation (WP42 Redesign V2)
 *
 * Features:
 * - Logo: Circle outline (not filled)
 * - 4 nav icons: Home, Library (document), Rules (link), Settings (bottom)
 * - Active state: Blue rounded background
 * - NO API indicator (moved to page headers)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Link2, Settings, Layers, Combine } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
} from '@/components/ui/sidebar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/nodes', label: 'Library', icon: FileText },
  { href: '/merges', label: 'Merges', icon: Combine },
  { href: '/rules', label: 'Rules', icon: Link2 },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/nodes' && pathname.startsWith('/viewer')) {
      return true;
    }
    // /merge/[id] should highlight Merges nav item
    if (href === '/merges' && pathname.startsWith('/merge')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border-primary bg-bg-primary">
      {/* Header - Logo */}
      <SidebarHeader className="flex items-center justify-center py-4">
        <Link href="/" className="flex items-center justify-center">
          <Layers className="text-text-muted" style={{ width: '1.4rem', height: '1.4rem' }} />
        </Link>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="flex flex-col items-center w-full">
        <SidebarGroup className="w-full">
          <SidebarMenu className="space-y-1 w-full">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <SidebarMenuItem key={item.href} className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.label}
                    className={cn(
                      'w-10 h-10 p-0 flex items-center justify-center rounded-lg',
                      'transition-colors',
                      active
                        ? 'bg-accent-primary text-white hover:bg-accent-hover'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - Settings (separated at bottom) */}
      <SidebarFooter className="mt-auto pb-4 w-full">
        <SidebarMenu className="w-full">
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              asChild
              isActive={pathname === '/settings'}
              tooltip="Settings"
              className={cn(
                'w-10 h-10 p-0 flex items-center justify-center rounded-lg',
                'transition-colors',
                pathname === '/settings'
                  ? 'bg-accent-primary text-white hover:bg-accent-hover'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              )}
            >
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
