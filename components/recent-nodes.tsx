'use client';

import { useNodesStore } from '@/lib/store';
import Image from 'next/image';
import Link from 'next/link';

export default function RecentNodes() {
  const nodes = useNodesStore((state) => state.nodes);

  // Get 5 most recent nodes (sorted by addedAt descending)
  const recentNodes = nodes
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  if (recentNodes.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border-primary shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Recent Nodes</h3>
        <p className="text-text-muted">No nodes imported yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-lg border border-border-primary shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Recent Nodes</h3>

      <div className="space-y-4">
        {recentNodes.map((node) => (
          <Link
            key={node.id}
            href={`/viewer/${node.id}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-hover transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-bg-secondary rounded-lg overflow-hidden flex-shrink-0">
              {node.thumbnail ? (
                <Image
                  src={node.thumbnail}
                  alt={node.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  📦
                </div>
              )}
            </div>

            {/* Node info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-text-primary truncate">
                {node.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span>{node.altNode?.type || 'Node'}</span>
                <span>•</span>
                <span>{new Date(node.addedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Category or description badge */}
            <div className="flex-shrink-0">
              {node.category && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-primary text-white">
                  {node.category}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
