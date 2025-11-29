'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
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
}: PropertyBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-800/40 rounded-md border border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-2 px-2.5 hover:bg-gray-700/30 transition-colors text-left rounded-t-md"
      >
        <ChevronRight
          className={cn(
            "w-3 h-3 transition-transform text-gray-500",
            isOpen && "rotate-90"
          )}
        />
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 pt-1 space-y-1">
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
    ? '—'
    : typeof value === 'boolean'
    ? (value ? '✓' : '✗')
    : value;

  if (inline) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500">{label}</span>
        <span className="text-[11px] text-gray-200">
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-[11px] text-gray-200 pl-2">
        {displayValue}
      </div>
    </div>
  );
}
