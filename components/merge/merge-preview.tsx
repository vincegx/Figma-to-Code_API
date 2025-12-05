'use client';

/**
 * Merge Preview Component
 *
 * Displays a responsive preview of the generated merge code.
 * Adjusts container width based on the selected breakpoint.
 * Uses an iframe to render the HTML preview in isolation.
 */

import { useMemo } from 'react';
import type { Breakpoint, MergeSourceNode, FrameworkType } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

interface MergePreviewProps {
  code: string;
  framework: FrameworkType;
  breakpoint: Breakpoint;
  sourceNodes?: readonly MergeSourceNode[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTHS: Record<Breakpoint, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
};

// ============================================================================
// Component
// ============================================================================

export function MergePreview({
  code,
  framework,
  breakpoint,
  sourceNodes,
}: MergePreviewProps) {
  // Get width from source nodes or use default
  const width = useMemo(() => {
    if (sourceNodes) {
      const node = sourceNodes.find((n) => n.breakpoint === breakpoint);
      if (node?.width) return node.width;
    }
    return DEFAULT_WIDTHS[breakpoint];
  }, [breakpoint, sourceNodes]);

  // Generate full HTML document for iframe preview
  const previewHtml = useMemo(() => {
    const isHtml = framework === 'html-css';

    // For HTML/CSS, use the code directly
    if (isHtml) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }

    // For React/TSX, we need to extract the JSX and wrap it
    // This is a simplified approach - in production, you'd use a proper React renderer
    const jsxMatch = code.match(/return\s*\(([\s\S]*?)\);/);
    const jsxContent = jsxMatch ? jsxMatch[1] : '<div>Preview not available</div>';

    // Convert className to class for HTML
    const htmlContent = jsxContent
      .replace(/className=/g, 'class=')
      .replace(/<>/g, '<div>')
      .replace(/<\/>/g, '</div>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  }, [code, framework]);

  // Create a data URL for the iframe
  const iframeSrc = useMemo(() => {
    return `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
  }, [previewHtml]);

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-muted/50 p-4">
      <div
        className="overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300"
        style={{ width: `${width}px`, maxWidth: '100%' }}
      >
        {/* Device frame header */}
        <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-muted-foreground">
            {breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)} Preview
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {width}px
          </span>
        </div>

        {/* Preview iframe */}
        <iframe
          src={iframeSrc}
          title="Merge Preview"
          className="h-[500px] w-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
