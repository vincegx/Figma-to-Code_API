'use client';

/**
 * Delete Merge Dialog
 *
 * Confirmation dialog before deleting a merge.
 * Shows merge name and requires explicit confirmation.
 */

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================================
// Types
// ============================================================================

interface DeleteMergeDialogProps {
  open: boolean;
  mergeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DeleteMergeDialog({
  open,
  mergeName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteMergeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Merge</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&quot;{mergeName}&quot;</strong>?
            This will permanently remove the merge and all its generated code.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
