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
    <div className="bg-gray-100 dark:bg-gray-800/40 rounded-md border border-gray-200 dark:border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-2 px-2.5 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors text-left rounded-t-md"
      >
        <ChevronRight
          className={cn(
            "w-3 h-3 transition-transform text-gray-400 dark:text-gray-500",
            isOpen && "rotate-90"
          )}
        />
        <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
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
  const isBoolean = typeof value === 'boolean';
  const displayValue = value === null || value === undefined
    ? '—'
    : isBoolean
    ? (value ? 'Yes' : 'No')
    : value;

  if (inline) {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] text-gray-500">{label}</span>
        <span className={cn(
          "text-[13px]",
          isBoolean && value ? "text-green-600 dark:text-green-400" :
          isBoolean && !value ? "text-gray-400 dark:text-gray-500" :
          "text-gray-700 dark:text-gray-200"
        )}>
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-[13px] text-gray-500">{label}</div>
      <div className={cn(
        "text-[13px] pl-2",
        isBoolean && value ? "text-green-600 dark:text-green-400" :
        isBoolean && !value ? "text-gray-400 dark:text-gray-500" :
        "text-gray-700 dark:text-gray-200"
      )}>
        {displayValue}
      </div>
    </div>
  );
}
