'use client';

/**
 * NodeCard Component
 *
 * Grid view card for a single node.
 * VERBATIM from nodes/page.tsx - Phase 3 refactoring
 */

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

interface NodeCardProps {
  node: LibraryNode;
  stats: NodeStats;
  onOpenPreview: (nodeId: string) => void;
  onDelete: (node: { id: string; name: string }) => void;
}

export function NodeCard({ node, stats, onOpenPreview, onDelete }: NodeCardProps) {
  return (
    <div className="group bg-bg-card rounded-xl border border-border-primary overflow-hidden hover:border-border-secondary transition-all">
      {/* Preview Image with Hover Gradient */}
      <Link href={`/node/${node.id}`} className="block">
        <div className="aspect-[4/3] bg-bg-secondary flex items-start justify-center relative">
          {/* Hover Gradient Overlay (T395) */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none rounded-t-xl" />

          {node.thumbnail ? (
            <Image
              src={`${node.thumbnail}?w=400`}
              alt={node.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
            />
          ) : (
            <Box className="w-12 h-12 text-text-muted" />
          )}

          {/* Kebab Menu - z-index above gradient */}
          <div className="absolute top-2 right-2 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <button className="p-1.5 bg-bg-card/90 backdrop-blur-sm rounded-lg hover:bg-bg-card">
                  <MoreVertical className="w-4 h-4 text-text-primary" />
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
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete({ id: node.id, name: node.name });
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>

      {/* Card Footer - Name, Date, Stats */}
      <div className="p-3">
        <h3 className="font-medium text-text-primary truncate text-xs mb-1">{node.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {new Date(node.addedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="flex items-center gap-0.5">
              <Box className="w-3 h-3 text-blue-400" />
              {stats.elements}
            </span>
            <span className="flex items-center gap-0.5">
              <Layers className="w-3 h-3 text-white" />
              {stats.layers}
            </span>
            <span className="flex items-center gap-0.5">
              <Zap className="w-3 h-3 text-blue-400" />
              {stats.rules}
            </span>
            <span className="flex items-center gap-0.5">
              <FileText className="w-3 h-3 text-white" />
              {stats.exports}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
