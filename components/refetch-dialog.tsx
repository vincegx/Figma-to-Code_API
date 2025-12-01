'use client';

/**
 * RefetchDialog Component
 *
 * WP40 T347: Enhanced refetch dialog with version diff display.
 * Shows 3 states: confirmation, progression, and results (with diff or "already up to date")
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  CheckCircle2,
  CloudDownload,
  RefreshCw,
  Plus,
  Minus,
  Pencil,
  ImageIcon,
  Type,
  Square,
  Component,
  Frame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeDiff, RefetchResult, PropertyChange } from '@/lib/types/versioning';
import { REFETCH_STEPS, type StepStatus } from '@/hooks/use-figma-progress';

// Properties that are just propagation noise (parent updates when child changes)
const NOISE_PROPERTIES = ['overrides'];

// Filter diffs to show only real changes, not propagation noise
function filterNoisyDiffs(diffs: NodeDiff[]): NodeDiff[] {
  return diffs
    .map(diff => {
      if (diff.type !== 'modified' || !diff.changes) return diff;

      // Filter out noise properties
      const realChanges = diff.changes.filter(
        c => !NOISE_PROPERTIES.includes(c.property)
      );

      if (realChanges.length === 0) return null;

      return { ...diff, changes: realChanges };
    })
    .filter((diff): diff is NodeDiff => diff !== null);
}

// Get icon for node type
function getNodeTypeIcon(nodeType?: string) {
  switch (nodeType) {
    case 'TEXT': return <Type className="w-3.5 h-3.5" />;
    case 'FRAME': return <Frame className="w-3.5 h-3.5" />;
    case 'INSTANCE': case 'COMPONENT': return <Component className="w-3.5 h-3.5" />;
    default: return <Square className="w-3.5 h-3.5" />;
  }
}

// Extract color from Figma fill object
function extractColor(fill: unknown): string | null {
  if (!fill || typeof fill !== 'object') return null;
  const f = fill as Record<string, unknown>;
  if (f.type !== 'SOLID' || !f.color) return null;
  const c = f.color as { r: number; g: number; b: number };
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`.toUpperCase();
}

// Format a property change for display
function formatChange(change: PropertyChange): { label: string; oldDisplay: React.ReactNode; newDisplay: React.ReactNode } | null {
  const { property, oldValue, newValue } = change;

  // Handle fills (colors)
  if (property === 'fills' && Array.isArray(oldValue) && Array.isArray(newValue)) {
    const oldColor = extractColor(oldValue[0]);
    const newColor = extractColor(newValue[0]);
    if (oldColor && newColor && oldColor !== newColor) {
      return {
        label: 'Couleur',
        oldDisplay: <ColorBadge color={oldColor} />,
        newDisplay: <ColorBadge color={newColor} />,
      };
    }
  }

  // Handle text content
  if (property === 'characters') {
    return {
      label: 'Texte',
      oldDisplay: <span className="text-gray-600">&quot;{String(oldValue).slice(0, 20)}&quot;</span>,
      newDisplay: <span className="text-gray-900 dark:text-gray-100">&quot;{String(newValue).slice(0, 20)}&quot;</span>,
    };
  }

  // Handle dimensions
  if (['width', 'height'].includes(property)) {
    return {
      label: property === 'width' ? 'Largeur' : 'Hauteur',
      oldDisplay: <span>{Math.round(Number(oldValue))}px</span>,
      newDisplay: <span className="font-medium">{Math.round(Number(newValue))}px</span>,
    };
  }

  // Handle visibility
  if (property === 'visible') {
    return {
      label: 'Visibilité',
      oldDisplay: <span>{oldValue ? 'Visible' : 'Masqué'}</span>,
      newDisplay: <span className="font-medium">{newValue ? 'Visible' : 'Masqué'}</span>,
    };
  }

  // Handle opacity
  if (property === 'opacity') {
    return {
      label: 'Opacité',
      oldDisplay: <span>{Math.round(Number(oldValue) * 100)}%</span>,
      newDisplay: <span className="font-medium">{Math.round(Number(newValue) * 100)}%</span>,
    };
  }

  // Default: skip complex objects, show simple values
  if (typeof oldValue === 'object' || typeof newValue === 'object') {
    return null;
  }

  return {
    label: property,
    oldDisplay: <span className="text-gray-500">{String(oldValue).slice(0, 15)}</span>,
    newDisplay: <span>{String(newValue).slice(0, 15)}</span>,
  };
}

// Color badge component
function ColorBadge({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-xs">{color}</span>
    </span>
  );
}

interface RefetchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeName?: string;
  lastSyncDate?: string;
  onRefetch: () => Promise<void>;
  isRefetching: boolean;
  progress: {
    currentStep: number;
    totalSteps: number;
    stepId?: string;
    stepStatus?: StepStatus;
    message?: string;
  };
  result: RefetchResult | null;
  error: string | null;
  onReset: () => void;
}

type DialogState = 'confirmation' | 'progress' | 'result';

export function RefetchDialog({
  open,
  onOpenChange,
  nodeId: _nodeId,
  nodeName,
  lastSyncDate,
  onRefetch,
  isRefetching,
  progress,
  result,
  error,
  onReset,
}: RefetchDialogProps) {
  // nodeId kept in props for future use (e.g., API calls from dialog)
  void _nodeId;
  const [dialogState, setDialogState] = useState<DialogState>('confirmation');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDialogState('confirmation');
      onReset();
    }
  }, [open, onReset]);

  // Transition to progress state when refetch starts
  useEffect(() => {
    if (isRefetching) {
      setDialogState('progress');
    }
  }, [isRefetching]);

  // Transition to result state when refetch completes
  useEffect(() => {
    if (!isRefetching && (result || error)) {
      setDialogState('result');
    }
  }, [isRefetching, result, error]);

  const handleConfirm = async () => {
    await onRefetch();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const progressPercent = progress.totalSteps > 0
    ? (progress.currentStep / progress.totalSteps) * 100
    : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Confirmation State */}
        {dialogState === 'confirmation' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CloudDownload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Synchroniser depuis Figma
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {/* Node info */}
              {nodeName && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <Frame className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{nodeName}</span>
                </div>
              )}

              {/* Last sync info */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Dernière synchronisation : {formatDate(lastSyncDate)}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Synchroniser
              </Button>
            </div>
          </>
        )}

        {/* Progress State */}
        {dialogState === 'progress' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                Synchronisation Figma
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {REFETCH_STEPS.map((step, index) => {
                const isActive = progress.stepId === step.id;
                const isPast = index < progress.currentStep - 1;
                const status = isActive ? progress.stepStatus : (isPast ? 'completed' : 'pending');

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      status === 'completed' && 'text-green-600',
                      status === 'in-progress' && 'text-blue-600 font-medium',
                      status === 'error' && 'text-red-600',
                      status === 'skipped' && 'text-gray-400',
                      status === 'pending' && 'text-gray-400'
                    )}
                  >
                    {status === 'completed' && <Check className="w-4 h-4" />}
                    {status === 'in-progress' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {status === 'skipped' && <span className="w-4 h-4 text-center">○</span>}
                    {status === 'pending' && <span className="w-4 h-4 text-center">○</span>}
                    {status === 'error' && <span className="w-4 h-4 text-center">✗</span>}
                    <span>{step.label}</span>
                    {isActive && progress.message && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {progress.message}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="pt-2">
                <Progress value={progressPercent} className="h-2" />
                <div className="text-xs text-center text-gray-500 mt-1">
                  {Math.round(progressPercent)}%
                </div>
              </div>
            </div>
          </>
        )}

        {/* Result State */}
        {dialogState === 'result' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {error ? (
                  <>
                    <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">✕</span>
                    Erreur
                  </>
                ) : result?.status === 'up_to_date' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500" />
                    Déjà à jour
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500" />
                    Synchronisation terminée
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {error ? (
                <p className="text-red-600 text-sm">{error}</p>
              ) : result?.status === 'up_to_date' ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Aucun changement détecté depuis la dernière synchronisation.
                </p>
              ) : (
                <ResultContent result={result} />
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                {result?.status === 'up_to_date' ? 'OK' : 'Fermer'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Result content with summary and filtered diff
 */
function ResultContent({
  result,
}: {
  result: RefetchResult | null;
}) {
  if (!result) {
    return <p className="text-gray-600 text-sm">Mise à jour effectuée.</p>;
  }

  // Filter noisy diffs for display
  const filteredDiffs = result.diff ? filterNoisyDiffs(result.diff) : [];

  // Calculate summary from filtered diffs
  const summary = {
    modified: filteredDiffs.filter(d => d.type === 'modified').length,
    added: filteredDiffs.filter(d => d.type === 'added').length + (result.summary?.nodesAdded || 0),
    removed: filteredDiffs.filter(d => d.type === 'removed').length + (result.summary?.nodesRemoved || 0),
    images: result.summary?.newImages?.length || 0,
  };

  const totalChanges = summary.modified + summary.added + summary.removed;

  if (totalChanges === 0 && summary.images === 0) {
    return <p className="text-gray-600 dark:text-gray-400 text-sm">Mise à jour effectuée (modifications mineures).</p>;
  }

  return (
    <div className="space-y-3">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {summary.modified > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Pencil className="w-3 h-3" />
            {summary.modified} modifié{summary.modified > 1 ? 's' : ''}
          </span>
        )}
        {summary.added > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Plus className="w-3 h-3" />
            {summary.added} ajouté{summary.added > 1 ? 's' : ''}
          </span>
        )}
        {summary.removed > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <Minus className="w-3 h-3" />
            {summary.removed} supprimé{summary.removed > 1 ? 's' : ''}
          </span>
        )}
        {summary.images > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <ImageIcon className="w-3 h-3" />
            {summary.images} image{summary.images > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Always show diff details with scrollbar */}
      {filteredDiffs.length > 0 && <DiffDetails diffs={filteredDiffs} />}
    </div>
  );
}

/**
 * Detailed diff display with formatted changes
 */
function DiffDetails({ diffs }: { diffs: NodeDiff[] }) {
  return (
    <div className="space-y-2 max-h-52 overflow-y-auto">
      {diffs.map((diff, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border p-3 text-sm',
            diff.type === 'added' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
            diff.type === 'removed' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
            diff.type === 'modified' && 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
          )}
        >
          {/* Node header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'flex items-center justify-center w-5 h-5 rounded',
              diff.type === 'added' && 'text-green-600',
              diff.type === 'removed' && 'text-red-600',
              diff.type === 'modified' && 'text-amber-600'
            )}>
              {diff.type === 'added' && <Plus className="w-4 h-4" />}
              {diff.type === 'removed' && <Minus className="w-4 h-4" />}
              {diff.type === 'modified' && <Pencil className="w-4 h-4" />}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{diff.nodeName}</span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {getNodeTypeIcon(diff.nodeType)}
              {diff.nodeType}
            </span>
          </div>

          {/* Property changes */}
          {diff.type === 'modified' && diff.changes && (
            <div className="space-y-1.5 ml-7">
              {diff.changes.map((change, i) => {
                const formatted = formatChange(change);
                if (!formatted) return null;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 min-w-[60px]">{formatted.label}</span>
                    <span className="text-gray-400">{formatted.oldDisplay}</span>
                    <span className="text-gray-400">→</span>
                    <span>{formatted.newDisplay}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default RefetchDialog;
