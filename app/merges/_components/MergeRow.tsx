'use client';

/**
 * MergeRow Component
 *
 * List view row for a single merge.
 * VERBATIM from merges/page.tsx - Phase 3 refactoring
 */

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Layers, MoreVertical, Eye, Trash2, AlertTriangle, Smartphone, Tablet, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MergeListItem } from '@/lib/types/merge';
import { StatusBadge } from './StatusBadge';

interface MergeRowProps {
  merge: MergeListItem;
  isSelected: boolean;
  onToggleSelection: (mergeId: string) => void;
  onDeleteClick: (merge: MergeListItem) => void;
}

export function MergeRow({ merge, isSelected, onToggleSelection, onDeleteClick }: MergeRowProps) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/merge/${merge.id}`)}
      className="cursor-pointer hover:bg-bg-hover transition-colors"
    >
      {/* Checkbox */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(merge.id)}
          className="rounded border-border-primary"
        />
      </td>
      {/* Thumbnails */}
      <td className="px-2 py-3">
        <div className="flex items-center gap-0.5">
          {merge.sourceNodes.map((node, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded overflow-hidden bg-bg-secondary border border-border-primary',
                node.breakpoint === 'mobile' && 'w-5 h-8',
                node.breakpoint === 'tablet' && 'w-7 h-6',
                node.breakpoint === 'desktop' && 'w-9 h-6'
              )}
            >
              {node.thumbnail ? (
                <Image
                  src={node.thumbnail}
                  alt={node.nodeName}
                  width={36}
                  height={32}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <Layers className="w-2 h-2" />
                </div>
              )}
            </div>
          ))}
        </div>
      </td>
      {/* Name */}
      <td className="px-4 py-3">
        <span className="font-medium text-text-primary hover:text-accent-primary">
          {merge.name}
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={merge.status} />
      </td>
      {/* Sources */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-text-muted">
          {merge.sourceNodes.map((node, idx) => (
            <span key={idx} title={node.nodeName}>
              {node.breakpoint === 'mobile' && <Smartphone className="w-4 h-4" />}
              {node.breakpoint === 'tablet' && <Tablet className="w-4 h-4" />}
              {node.breakpoint === 'desktop' && <Monitor className="w-4 h-4" />}
            </span>
          ))}
        </div>
      </td>
      {/* Created */}
      <td className="px-4 py-3 text-sm text-text-muted">
        {new Date(merge.createdAt).toLocaleDateString()}
      </td>
      {/* Warnings */}
      <td className="px-4 py-3">
        {merge.warningCount > 0 ? (
          <span className="flex items-center gap-1 text-sm text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            {merge.warningCount}
          </span>
        ) : (
          <span className="text-sm text-text-muted">-</span>
        )}
      </td>
      {/* Actions */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/merge/${merge.id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View merge
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => onDeleteClick(merge)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
