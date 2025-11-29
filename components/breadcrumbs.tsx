'use client';

import Link from 'next/link';
import { ChevronRight, Home, Library } from 'lucide-react';
import { FigmaTypeIcon } from './figma-type-icon';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  figmaType?: string; // For showing Figma node type icon
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-text-muted', className)}
    >
      {/* Home link */}
      <Link
        href="/"
        className="flex items-center hover:text-text-secondary transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-text-muted" />

          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center gap-1.5 hover:text-text-secondary transition-colors"
            >
              {item.figmaType && (
                <FigmaTypeIcon type={item.figmaType} size={14} />
              )}
              {item.label === 'Library' && !item.figmaType && (
                <Library className="h-4 w-4" />
              )}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-text-primary font-medium">
              {item.figmaType && (
                <FigmaTypeIcon type={item.figmaType} size={14} />
              )}
              <span className="truncate max-w-[200px]">{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
