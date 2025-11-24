'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNodeColors } from '@/lib/utils/node-colors';

interface TechnicalRenderPanelProps {
  node: SimpleAltNode | null;
}

// =============================================================================
// REUSABLE SUB-COMPONENTS (matching T151 PropertySection style)
// =============================================================================

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}

function PropertySection({ title, children, defaultOpen = true, action }: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={12} className="text-gray-400" />
          ) : (
            <ChevronRight size={12} className="text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="text-xs">{value}</div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'purple';
  className?: string;
}

function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} className="text-gray-400" />
      )}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TechnicalRenderPanel({ node }: TechnicalRenderPanelProps) {
  if (!node) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
        Select a node to view technical details
      </div>
    );
  }

  const figmaType = node.originalNode?.type || 'UNKNOWN';
  const htmlType = node.type;
  const cssText = formatStyles(node.styles);

  // Count children by Figma type
  const childrenByType: Record<string, number> = {};
  if (node.children) {
    for (const child of node.children) {
      const childType = child.originalNode?.type || 'UNKNOWN';
      childrenByType[childType] = (childrenByType[childType] || 0) + 1;
    }
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900">
      {/* CSS Properties Section */}
      <PropertySection
        title="CSS Properties"
        defaultOpen={true}
        action={<CopyButton text={cssText} />}
      >
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-auto max-h-64">
          <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {cssText || '/* No styles computed */'}
          </pre>
        </div>
      </PropertySection>

      {/* Node Info Section */}
      <PropertySection title="Node Info" defaultOpen={true}>
        <div className="space-y-1">
          <InfoRow
            label="Figma Type"
            value={
              <Badge variant={figmaType === 'INSTANCE' || figmaType === 'COMPONENT' ? 'purple' : 'info'}>
                {figmaType}
              </Badge>
            }
          />
          <InfoRow
            label="HTML Type"
            value={<Badge variant="default">{htmlType}</Badge>}
          />
          <InfoRow
            label="Unique Name"
            value={
              <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                {node.uniqueName}
              </span>
            }
          />
          <InfoRow
            label="Node ID"
            value={
              <div className="flex items-center gap-1">
                <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 text-[11px]">
                  {node.id}
                </code>
                <CopyButton text={node.id} />
              </div>
            }
          />
        </div>
      </PropertySection>

      {/* Status Flags Section */}
      <PropertySection title="Status Flags" defaultOpen={true}>
        <div className="flex flex-wrap gap-2 mb-3">
          {node.visible ? (
            <Badge variant="success">Visible</Badge>
          ) : (
            <Badge variant="default">Hidden</Badge>
          )}
          {node.canBeFlattened && (
            <Badge variant="warning">Can Flatten</Badge>
          )}
          {node.isIcon && (
            <Badge variant="info">Is Icon</Badge>
          )}
        </div>
        {node.cumulativeRotation !== 0 && (
          <InfoRow
            label="Cumulative Rotation"
            value={
              <span className="font-mono text-gray-900 dark:text-white">
                {node.cumulativeRotation.toFixed(1)}°
              </span>
            }
          />
        )}
      </PropertySection>

      {/* Children Section */}
      {node.children && node.children.length > 0 && (
        <PropertySection title="Children" defaultOpen={true}>
          <InfoRow
            label="Count"
            value={
              <span className="font-medium text-gray-900 dark:text-white">
                {node.children.length}
              </span>
            }
          />
          <div className="mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
              Types breakdown:
            </span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(childrenByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const colors = getNodeColors(type);
                  return (
                    <span
                      key={type}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        colors.bg,
                        colors.text
                      )}
                    >
                      {type} ({count})
                    </span>
                  );
                })}
            </div>
          </div>
        </PropertySection>
      )}

      {/* Original Node Data Section (collapsed by default) */}
      <PropertySection title="Raw Data" defaultOpen={false}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-auto max-h-64">
          <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {JSON.stringify({
              id: node.id,
              name: node.name,
              type: node.type,
              figmaType: node.originalNode?.type,
              visible: node.visible,
              uniqueName: node.uniqueName,
              canBeFlattened: node.canBeFlattened,
              isIcon: node.isIcon,
              cumulativeRotation: node.cumulativeRotation,
              childrenCount: node.children?.length || 0,
            }, null, 2)}
          </pre>
        </div>
      </PropertySection>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatStyles(styles: Record<string, string | number>): string {
  if (!styles || Object.keys(styles).length === 0) {
    return '';
  }

  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n');
}

export default TechnicalRenderPanel;
