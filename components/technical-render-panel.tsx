'use client';

import type { SimpleAltNode } from '@/lib/altnode-transform';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TechnicalRenderPanelProps {
  node: SimpleAltNode | null;
}

export function TechnicalRenderPanel({ node }: TechnicalRenderPanelProps) {
  if (!node) {
    return (
      <div className="p-4 text-muted-foreground">
        Select a node to view technical details
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* CSS Properties */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">CSS Properties</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64 font-mono">
            {formatStyles(node.styles)}
          </pre>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Figma Type:</span>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              {node.originalNode?.type || 'UNKNOWN'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">HTML Type:</span>
            <Badge variant="outline">{node.type}</Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">ID:</span>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              {node.id}
            </code>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Unique Name:</span>
            <Badge variant="secondary">{node.uniqueName}</Badge>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {node.canBeFlattened && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              >
                Can be flattened
              </Badge>
            )}

            {node.isIcon && (
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
              >
                Icon
              </Badge>
            )}

            {!node.visible && (
              <Badge
                variant="outline"
                className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
              >
                Hidden
              </Badge>
            )}

            {node.cumulativeRotation !== 0 && (
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
              >
                Rotated {node.cumulativeRotation.toFixed(1)}°
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Children info */}
      {node.children && node.children.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Count:</span>{' '}
              <span className="font-medium">{node.children.length}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Figma Types:{' '}
              {[...new Set(node.children.map((c) => c.originalNode?.type || 'UNKNOWN'))].join(', ')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              HTML Types:{' '}
              {[...new Set(node.children.map((c) => c.type))].join(', ')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatStyles(styles: Record<string, string | number>): string {
  if (!styles || Object.keys(styles).length === 0) {
    return '/* No styles computed */';
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
