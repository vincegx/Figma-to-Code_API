'use client';

/**
 * PreviewCanvas Component
 *
 * Canvas preview with device selector, grid toggle, and fullscreen mode.
 * VERBATIM from viewer/[nodeId]/page.tsx lines 746-826 - Phase 3 refactoring
 */

import { forwardRef } from 'react';
import {
  Monitor,
  Grid3x3,
  Smartphone,
  Tablet,
  Copy,
  Maximize2,
} from 'lucide-react';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { cn } from '@/lib/utils';
import type { FrameworkType } from '@/lib/types/rules';

interface PreviewCanvasProps {
  iframeKey: number;
  generatedCode: string;
  previewFramework: FrameworkType;
  googleFontsUrl: string | undefined;
  viewerResponsiveMode: boolean;
  viewerViewportWidth: number;
  viewerViewportHeight: number;
  viewerGridVisible: boolean;
  viewerGridSpacing: number;
  onResponsiveModeChange: (mode: boolean) => void;
  onViewportSizeChange: (width: number, height: number) => void;
  onGridVisibleChange: (visible: boolean) => void;
  onFullscreenClick: () => void;
}

export const PreviewCanvas = forwardRef<LivePreviewHandle, PreviewCanvasProps>(
  function PreviewCanvas(
    {
      iframeKey,
      generatedCode,
      previewFramework,
      googleFontsUrl,
      viewerResponsiveMode,
      viewerViewportWidth,
      viewerViewportHeight,
      viewerGridVisible,
      viewerGridSpacing,
      onResponsiveModeChange,
      onViewportSizeChange,
      onGridVisibleChange,
      onFullscreenClick,
    },
    ref
  ) {
    return (
      <div className="flex-1 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
            <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
            {/* Device icons for responsive mode */}
            <div className="flex items-center gap-0.5 p-0.5 bg-bg-secondary rounded">
              <button
                onClick={() => { onResponsiveModeChange(true); onViewportSizeChange(375, 667); }}
                className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 375 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
                title="Mobile (375×667)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { onResponsiveModeChange(true); onViewportSizeChange(768, 1024); }}
                className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 768 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
                title="Tablet (768×1024)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onResponsiveModeChange(false)}
                className={cn('w-6 h-6 flex items-center justify-center rounded', !viewerResponsiveMode ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
                title="Desktop (Full width)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onResponsiveModeChange(!viewerResponsiveMode)}
              className={cn('w-7 h-7 flex items-center justify-center rounded', viewerResponsiveMode ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')}
              title={viewerResponsiveMode ? "Exit responsive mode" : "Enter responsive mode (resize preview)"}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onGridVisibleChange(!viewerGridVisible)}
              className={cn('w-7 h-7 flex items-center justify-center rounded', viewerGridVisible ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')}
              title="Toggle grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={onFullscreenClick}
              className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-bg-secondary">
          <ResizablePreviewViewport>
            {viewerGridVisible && (
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(0deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px),
                    repeating-linear-gradient(90deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px)
                  `,
                }}
              />
            )}
            <LivePreview
              ref={ref}
              key={iframeKey}
              code={generatedCode}
              framework={previewFramework}
              language={previewFramework === 'html-css' ? 'html' : 'tsx'}
              googleFontsUrl={googleFontsUrl}
            />
          </ResizablePreviewViewport>
        </div>
      </div>
    );
  }
);
