'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyBlockProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export function PropertyBlock({
  title,
  children,
  defaultOpen = true,
  icon,
}: PropertyBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-primary last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-bg-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform text-text-muted",
              isOpen && "rotate-180"
            )}
          />
          {icon && <span className="text-text-muted">{icon}</span>}
          <h3 className="font-semibold text-xs text-text-primary">
            {title}
          </h3>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

interface PropertyItemProps {
  label: string;
  value: string | number | boolean | null | undefined;
  inline?: boolean;
}

export function PropertyItem({ label, value, inline = true }: PropertyItemProps) {
  const displayValue = value === null || value === undefined
    ? 'N/A'
    : typeof value === 'boolean'
    ? (value ? '✓' : '✗')
    : value;

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary">{label}:</span>
        <span className="text-[11px] font-medium text-text-primary">
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-xs text-text-secondary">{label}:</div>
      <div className="text-[11px] font-medium text-text-primary pl-2">
        {displayValue}
      </div>
    </div>
  );
}
