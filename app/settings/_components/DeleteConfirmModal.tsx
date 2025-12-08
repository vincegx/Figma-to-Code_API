'use client';

/**
 * DeleteConfirmModal Component
 *
 * Secure delete confirmation modal for Figma data.
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CacheStats {
  size: string;
  nodeCount: number;
}

interface DeleteConfirmModalProps {
  open: boolean;
  cacheStats: CacheStats | null;
  deleteConfirmText: string;
  clearingCache: boolean;
  onConfirmTextChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  open,
  cacheStats,
  deleteConfirmText,
  clearingCache,
  onConfirmTextChange,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-bg-card border border-border-primary rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">Delete all Figma data?</h3>
        </div>

        {/* Warning content */}
        <div className="mb-6 space-y-3">
          <p className="text-sm text-text-secondary">
            This action is <span className="text-red-400 font-semibold">irreversible</span>. You will permanently lose:
          </p>
          <ul className="text-sm text-text-muted space-y-1 ml-4">
            <li>• <span className="text-text-secondary font-medium">{cacheStats?.nodeCount || 0} exported designs</span></li>
            <li>• <span className="text-text-secondary font-medium">{cacheStats?.size || '0 B'} of data</span></li>
            <li>• All metadata, versions, and screenshots</li>
          </ul>
          <p className="text-sm text-text-muted pt-2">
            You will need to re-import from Figma to recover this data.
          </p>
        </div>

        {/* Confirmation input */}
        <div className="mb-6">
          <label className="block text-sm text-text-secondary mb-2">
            Type <span className="font-mono bg-bg-secondary px-1.5 py-0.5 rounded text-red-400">DELETE</span> to confirm:
          </label>
          <Input
            value={deleteConfirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
            placeholder="DELETE"
            className="font-mono"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleteConfirmText !== 'DELETE' || clearingCache}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingCache ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete All
          </Button>
        </div>
      </div>
    </div>
  );
}
