'use client';

/**
 * CanvasPreviewBlock Component
 *
 * Canvas preview with toolbar, device buttons, grid, and fullscreen mode.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useState, type RefObject } from 'react';
import {
  Monitor,
  Grid3x3,
  Smartphone,
  Tablet,
  Copy,
  Maximize2,
  X,
} from 'lucide-react';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { cn } from '@/lib/utils';

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

interface CanvasPreviewBlockProps {
  livePreviewRef: RefObject<LivePreviewHandle>;
  iframeKey: number;
  generatedCode: string;
  previewFramework: MergeFrameworkType;
  breakpoints?: { mobileWidth: number; tabletWidth: number };
  googleFontsUrl?: string | null;
  // UI Store values
  viewerResponsiveMode: boolean;
  viewerViewportWidth: number;
  viewerViewportHeight: number;
  viewerGridVisible: boolean;
  viewerGridSpacing: number;
  // UI Store setters
  setViewerResponsiveMode: (mode: boolean) => void;
  setViewerViewportSize: (width: number, height: number) => void;
  setViewerGridVisible: (visible: boolean) => void;
}

export function CanvasPreviewBlock({
  livePreviewRef,
  iframeKey,
  generatedCode,
  previewFramework,
  breakpoints,
  googleFontsUrl,
  viewerResponsiveMode,
  viewerViewportWidth,
  viewerViewportHeight,
  viewerGridVisible,
  viewerGridSpacing,
  setViewerResponsiveMode,
  setViewerViewportSize,
  setViewerGridVisible,
}: CanvasPreviewBlockProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shared toolbar content
  const renderToolbar = (showFullscreenButton: boolean) => (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
        <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
        {/* Device icons */}
        <div className="flex items-center gap-0.5 p-0.5 bg-bg-secondary rounded">
          <button
            onClick={() => { setViewerResponsiveMode(true); setViewerViewportSize(375, 667); }}
            className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 375 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
            title="Mobile (375×667)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setViewerResponsiveMode(true); setViewerViewportSize(768, 1024); }}
            className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 768 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
            title="Tablet (768×1024)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewerResponsiveMode(false)}
            className={cn('w-6 h-6 flex items-center justify-center rounded', !viewerResponsiveMode ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')}
            title="Desktop (Full width)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewerResponsiveMode(!viewerResponsiveMode)}
          className={cn('w-7 h-7 flex items-center justify-center rounded', viewerResponsiveMode ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')}
          title={viewerResponsiveMode ? "Exit responsive mode" : "Enter responsive mode"}
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewerGridVisible(!viewerGridVisible)}
          className={cn('w-7 h-7 flex items-center justify-center rounded', viewerGridVisible ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')}
          title="Toggle grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>
        {showFullscreenButton ? (
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsFullscreen(false)}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Exit fullscreen"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // Shared grid overlay
  const renderGridOverlay = () => viewerGridVisible && (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px),
          repeating-linear-gradient(90deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px)
        `,
      }}
    />
  );

  return (
    <>
      {/* Normal view */}
      <div className="flex-1 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
        {renderToolbar(true)}
        <div className="flex-1 relative bg-bg-secondary">
          <ResizablePreviewViewport>
            {renderGridOverlay()}
            <LivePreview
              ref={livePreviewRef}
              key={iframeKey}
              code={generatedCode}
              framework={previewFramework}
              language={previewFramework === 'html-css' ? 'html' : 'tsx'}
              breakpoints={breakpoints}
              googleFontsUrl={googleFontsUrl || undefined}
            />
          </ResizablePreviewViewport>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          <div className="bg-bg-card">
            {renderToolbar(false)}
          </div>
          <div className="flex-1 relative bg-bg-secondary">
            <ResizablePreviewViewport>
              {renderGridOverlay()}
              <LivePreview
                key={`fullscreen-${iframeKey}`}
                code={generatedCode}
                framework={previewFramework}
                language={previewFramework === 'html-css' ? 'html' : 'tsx'}
                breakpoints={breakpoints}
                googleFontsUrl={googleFontsUrl || undefined}
              />
            </ResizablePreviewViewport>
          </div>
        </div>
      )}
    </>
  );
}
