'use client';

import { LibraryNode } from '@/lib/types/library';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Download, RefreshCw, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';

interface NodeCardProps {
  node: LibraryNode;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export default function NodeCard({ node, isSelected, onToggleSelect }: NodeCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`bg-bg-card rounded-lg border border-border-primary shadow-sm overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-accent-primary' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <Link href={`/viewer/${node.id}`} className="block relative">
        <div className="aspect-video bg-bg-secondary relative overflow-hidden">
          {node.thumbnail ? (
            <Image
              src={node.thumbnail}
              alt={node.name}
              fill
              className="object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-4xl">
              📦
            </div>
          )}

          {/* Selection Checkbox Overlay */}
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded"
            />
          </div>

          {/* Category Badge */}
          {node.category && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-accent-primary text-white text-xs rounded">
                {node.category}
              </span>
            </div>
          )}

          {/* Actions Overlay */}
          {showActions && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2">
              <Link
                href={`/viewer/${node.id}`}
                className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors"
                title="View"
              >
                <Eye className="w-5 h-5 text-text-primary" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  alert('Export feature - to be implemented');
                }}
                className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors"
                title="Export"
              >
                <Download className="w-5 h-5 text-text-primary" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  alert('Re-fetch feature - to be implemented');
                }}
                className="p-2 bg-bg-card rounded-full hover:bg-bg-hover transition-colors"
                title="Re-fetch from Figma"
              >
                <RefreshCw className="w-5 h-5 text-text-primary" />
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4">
        <Link
          href={`/viewer/${node.id}`}
          className="block mb-2"
        >
          <h3 className="font-semibold text-text-primary truncate hover:text-accent-primary">
            {node.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
          <span className="flex items-center gap-1">
            <span className="font-medium">{node.altNode?.type || 'Node'}</span>
          </span>
          <span className="text-xs">{new Date(node.addedAt).toLocaleDateString()}</span>
        </div>

        {/* Tags */}
        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {node.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-bg-secondary text-xs text-text-secondary rounded"
              >
                {tag}
              </span>
            ))}
            {node.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-text-muted">
                +{node.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-muted mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {node.usage.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {node.usage.exportCount}
            </span>
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {node.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border-primary">
          <button
            onClick={(e) => {
              e.preventDefault();
              alert('Rename feature - to be implemented');
            }}
            className="flex-1 text-xs text-text-secondary hover:text-accent-primary flex items-center justify-center gap-1"
            title="Rename"
          >
            <Edit className="w-3 h-3" />
            Rename
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const confirmed = window.confirm(`Delete "${node.name}"?`);
              if (confirmed) {
                alert('Delete action - to be wired to store');
              }
            }}
            className="flex-1 text-xs text-status-error-text hover:opacity-80 flex items-center justify-center gap-1"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
