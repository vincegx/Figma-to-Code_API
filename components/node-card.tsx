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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <Link href={`/viewer/${node.id}`} className="block relative">
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          {node.thumbnail ? (
            <Image
              src={node.thumbnail}
              alt={node.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
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
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                {node.category}
              </span>
            </div>
          )}

          {/* Actions Overlay */}
          {showActions && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2">
              <Link
                href={`/viewer/${node.id}`}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="View"
              >
                <Eye className="w-5 h-5 text-gray-700" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  alert('Export feature - to be implemented');
                }}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Export"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  alert('Re-fetch feature - to be implemented');
                }}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Re-fetch from Figma"
              >
                <RefreshCw className="w-5 h-5 text-gray-700" />
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
          <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
            {node.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {node.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{node.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
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
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {node.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.preventDefault();
              alert('Rename feature - to be implemented');
            }}
            className="flex-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1"
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
            className="flex-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center justify-center gap-1"
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
