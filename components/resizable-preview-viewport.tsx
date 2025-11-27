'use client';

import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/lib/store/ui-store';
import { cn } from '@/lib/utils';

/**
 * DragHandle Component
 * Provides visual drag handles with diagonal stripe pattern (Tailwind Play style)
 */
interface DragHandleProps {
  side: 'left' | 'right';
  maxWidth: number;
  currentWidth: number;
  onResize: (newWidth: number) => void;
}

function DragHandle({ side, maxWidth, currentWidth, onResize }: DragHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = (moveEvent.clientX - startX) * (side === 'left' ? -1 : 1);
      const newWidth = Math.max(300, Math.min(startWidth + delta, maxWidth));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        'w-[2.5rem] h-full cursor-ew-resize transition-colors',
        'bg-[image:repeating-linear-gradient(315deg,transparent,transparent_10px,rgb(148_163_184_/_0.1)_10px,rgb(148_163_184_/_0.1)_20px)]',
        'bg-[size:10px_10px]',
        'hover:bg-slate-800/30'
      )}
      onMouseDown={handleMouseDown}
      title={`Drag to resize viewport ${side}`}
    />
  );
}

/**
 * GridOverlay Component
 * Visual grid overlay with configurable spacing
 */
interface GridOverlayProps {
  spacing: number; // 8, 16, or 24
}

function GridOverlay({ spacing }: GridOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgb(148 163 184 / 0.1) 0px,
              transparent 1px,
              transparent ${spacing}px
            ),
            repeating-linear-gradient(
              90deg,
              rgb(148 163 184 / 0.1) 0px,
              transparent 1px,
              transparent ${spacing}px
            )
          `,
        }}
      />
    </div>
  );
}

/**
 * DimensionLabel Component
 * Displays current viewport dimensions in top-right corner
 */
interface DimensionLabelProps {
  width: number;
  height: number;
  maxWidth?: number;
  maxHeight?: number;
}

function DimensionLabel({ width, height, maxWidth, maxHeight }: DimensionLabelProps) {
  return (
    <div className="absolute top-4 right-4 z-50 bg-slate-900/90 text-white text-sm px-3 py-1.5 rounded-lg font-mono shadow-lg">
      <span className="font-semibold">{width} × {height}</span>
      {maxWidth && maxHeight && (
        <span className="text-slate-400 ml-2 text-xs">
          max: {maxWidth} × {maxHeight}
        </span>
      )}
    </div>
  );
}

/**
 * ResizablePreviewViewport Component
 * Wrapper for LivePreview with two modes:
 * - Normal mode: Full-width preview
 * - Responsive mode: Resizable viewport with drag handles, grid, and dimension label
 */
interface ResizablePreviewViewportProps {
  children: React.ReactNode;
}

export function ResizablePreviewViewport({ children }: ResizablePreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);

  const {
    viewerResponsiveMode,
    viewerViewportWidth,
    viewerViewportHeight,
    viewerGridVisible,
    viewerGridSpacing,
    setViewerViewportSize,
  } = useUIStore();

  // ResizeObserver to track available container space
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setAvailableWidth(width);
      setAvailableHeight(height);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Mode Normal: Preview 100% of panel
  if (!viewerResponsiveMode) {
    return (
      <div ref={containerRef} className="w-full h-full">
        {children}
      </div>
    );
  }

  // Mode Responsive: Resizable viewport with drag handles
  const HANDLE_WIDTH = 40; // 2.5rem = 40px
  const MARGIN = 80; // Additional margins
  const maxViewportWidth = Math.max(300, availableWidth - (HANDLE_WIDTH * 2) - MARGIN);
  const maxViewportHeight = Math.max(300, availableHeight - MARGIN);

  // Constrain viewport to available space
  const constrainedWidth = Math.min(viewerViewportWidth, maxViewportWidth);
  const constrainedHeight = Math.min(viewerViewportHeight, maxViewportHeight);

  const handleWidthResize = (newWidth: number) => {
    setViewerViewportSize(newWidth, constrainedHeight);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-950 overflow-hidden relative"
    >
      {/* Dimension label */}
      <DimensionLabel
        width={constrainedWidth}
        height={constrainedHeight}
        maxWidth={maxViewportWidth}
        maxHeight={maxViewportHeight}
      />

      {/* Centered viewport with drag handles */}
      <div className="flex items-center justify-center h-full gap-0">
        <DragHandle
          side="left"
          maxWidth={maxViewportWidth}
          currentWidth={constrainedWidth}
          onResize={handleWidthResize}
        />

        <div
          className="relative bg-white dark:bg-slate-900"
          style={{
            width: constrainedWidth,
            height: constrainedHeight,
          }}
        >
          {/* Grid overlay */}
          {viewerGridVisible && <GridOverlay spacing={viewerGridSpacing} />}

          {/* Live preview iframe */}
          {children}
        </div>

        <DragHandle
          side="right"
          maxWidth={maxViewportWidth}
          currentWidth={constrainedWidth}
          onResize={handleWidthResize}
        />
      </div>
    </div>
  );
}
