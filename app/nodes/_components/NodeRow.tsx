'use client';

/**
 * NodeRow Component
 *
 * List view row for a single node.
 * VERBATIM from nodes/page.tsx - Phase 3 refactoring
 */

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Layers, Zap, FileText, MoreVertical, Eye, Maximize2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LibraryNode } from '@/lib/types/library';

interface NodeStats {
  elements: number;
  layers: number;
  rules: number;
  exports: number;
}

interface NodeRowProps {
  node: LibraryNode;
  stats: NodeStats;
  shortId: string;
  isSelected: boolean;
  onToggleSelection: (nodeId: string) => void;
  onOpenPreview: (nodeId: string) => void;
  onDelete: (node: { id: string; name: string }) => void;
}

export function NodeRow({
  node,
  stats,
  shortId,
  isSelected,
  onToggleSelection,
  onOpenPreview,
  onDelete,
}: NodeRowProps) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/node/${node.id}`)}
      className="cursor-pointer hover:bg-bg-hover transition-colors"
    >
      {/* Checkbox - stop propagation */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(node.id)}
          className="rounded border-border-primary"
        />
      </td>
      <td className="px-2 py-3">
        <div className="w-10 h-10 rounded-lg bg-bg-secondary overflow-hidden relative flex-shrink-0">
          {node.thumbnail ? (
            <Image
              src={node.thumbnail}
              alt={node.name}
              fill
              className="object-cover object-top"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Box className="w-5 h-5 text-text-muted" />
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-medium text-text-primary hover:text-accent-primary">
          {node.name}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {shortId}
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {new Date(node.addedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Box className="w-4 h-4 text-blue-400" />
            {stats.elements}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-white" />
            {stats.layers}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-blue-400" />
            {stats.rules}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-white" />
            {stats.exports}
          </span>
        </div>
      </td>
      {/* Actions - stop propagation */}
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-text-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/node/${node.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View node
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenPreview(node.id)}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Open preview
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => onDelete({ id: node.id, name: node.name })}
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
