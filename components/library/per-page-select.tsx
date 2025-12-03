'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
}

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function PerPageSelect({ value, onChange }: PerPageSelectProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className="w-[130px] h-[38px] bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PER_PAGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option.toString()}>
            {option} per page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
