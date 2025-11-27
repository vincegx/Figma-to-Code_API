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
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-gray-500",
              isOpen && "rotate-180"
            )}
          />
          {icon && <span className="text-gray-600 dark:text-gray-400">{icon}</span>}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
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
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      <div className="text-gray-600 dark:text-gray-400">{label}:</div>
      <div className="font-medium text-gray-900 dark:text-white pl-2">
        {displayValue}
      </div>
    </div>
  );
}
