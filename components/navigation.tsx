'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, BookOpen, Settings, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuotaIndicator } from './quota/quota-indicator';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/nodes', label: 'Library', icon: Library },
  { href: '/rules', label: 'Rules', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  // Determine active path (handle viewer routes)
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // For viewer pages, consider Library as active
    if (href === '/nodes' && pathname.startsWith('/viewer')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-border-primary bg-bg-card">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent-primary" />
            <span className="font-semibold text-text-primary hidden sm:block">
              Figma Rules Builder
            </span>
          </Link>

          {/* Right side: Quota + Nav */}
          <div className="flex items-center gap-4">
            {/* API Quota Indicator (WP41) */}
            <QuotaIndicator />

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
