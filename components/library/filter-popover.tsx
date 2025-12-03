'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface FilterState {
  types: string[];
  dateRange: 'all' | '7d' | '30d' | '90d';
}

interface FilterPopoverProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

const NODE_TYPES = ['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP'] as const;

const DATE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const;

export function FilterPopover({ filters, onApply, onReset }: FilterPopoverProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [open, setOpen] = useState(false);

  const handleTypeToggle = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const handleDateChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      dateRange: value as FilterState['dateRange'],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = { types: [], dateRange: 'all' };
    setLocalFilters(defaultFilters);
    onReset();
    setOpen(false);
  };

  // Count active filters
  const activeCount = localFilters.types.length + (localFilters.dateRange !== 'all' ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-[38px] px-4 bg-bg-secondary text-text-secondary rounded-md hover:bg-bg-hover flex items-center gap-2 border border-border-primary">
          <Filter className="w-4 h-4" />
          Filter
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent-primary text-white rounded-full">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-bg-card border-border-primary" align="end">
        <div className="space-y-4">
          {/* Type Filter */}
          <div>
            <h4 className="font-medium text-text-primary text-sm mb-2">Type</h4>
            <div className="space-y-2">
              {NODE_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={localFilters.types.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                    className="border-border-primary data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm text-text-secondary cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <h4 className="font-medium text-text-primary text-sm mb-2">Date</h4>
            <RadioGroup
              value={localFilters.dateRange}
              onValueChange={handleDateChange}
              className="space-y-2"
            >
              {DATE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`date-${option.value}`}
                    className="border-border-primary text-accent-primary"
                  />
                  <Label
                    htmlFor={`date-${option.value}`}
                    className="text-sm text-text-secondary cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border-primary">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 bg-bg-secondary border-border-primary text-text-secondary hover:bg-bg-hover"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 bg-accent-primary text-white hover:bg-accent-hover"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
