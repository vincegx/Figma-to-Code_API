'use client';

import { Badge } from '@/components/ui/badge';

interface InstanceBadgeProps {
  componentName?: string;
}

export function InstanceBadge({ componentName }: InstanceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="bg-transparent text-purple-600 dark:text-purple-400 border-none text-[12px] leading-none py-0 px-0"
      title={componentName || 'Instance'}
    >
      ◆
    </Badge>
  );
}

export default InstanceBadge;
