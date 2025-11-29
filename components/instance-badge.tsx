'use client';

import { Badge } from '@/components/ui/badge';

interface InstanceBadgeProps {
  componentName?: string;
}

export function InstanceBadge({ componentName }: InstanceBadgeProps) {
  if (!componentName) return null;

  return (
    <Badge
      variant="outline"
      className="bg-transparent text-purple-600 dark:text-purple-400 border-none text-xs py-0 px-0"
    >
      ◆
    </Badge>
  );
}

export default InstanceBadge;
