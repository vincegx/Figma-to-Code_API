'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RulesDetailPanel } from './rules-detail-panel';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';

interface RulesDetailSheetProps {
  rule: MultiFrameworkRule | null;
  selectedFramework: FrameworkType;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function RulesDetailSheet({
  rule,
  selectedFramework,
  open,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: RulesDetailSheetProps) {
  if (!rule) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] p-0 rounded-t-xl overflow-hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{rule.name}</SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-hidden">
          <RulesDetailPanel
            rule={rule}
            selectedFramework={selectedFramework}
            onClose={onClose}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
