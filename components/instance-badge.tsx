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
      className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs py-0 px-1.5 h-5"
    >
      ↳ {componentName}
    </Badge>
  );
}

export default InstanceBadge;
