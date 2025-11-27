'use client';

import { useEffect, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import { useUIStore } from '@/lib/store/ui-store';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

function GridOverlay({ spacing }: { spacing: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${spacing}px),
            repeating-linear-gradient(90deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${spacing}px)
          `,
        }}
      />
    </div>
  );
}

function DimensionLabel({ width, height, onPresetClick }: { width: number; height: number; onPresetClick: (w: number, h: number) => void }) {
  const presets = [
    { icon: Smartphone, width: 375, height: 667, label: 'Mobile' },
    { icon: Tablet, width: 768, height: 1024, label: 'Tablet' },
    { icon: Monitor, width: 1440, height: 900, label: 'Desktop' },
  ];

  return (
    <div className="absolute top-4 right-4 z-50 bg-slate-900/90 text-white text-sm rounded-lg font-mono shadow-lg overflow-hidden">
      <div className="flex items-center divide-x divide-slate-700">
        <div className="px-3 py-1.5">
          <span className="font-semibold">{width} × {height}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onPresetClick(preset.width, preset.height)}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title={`${preset.label} (${preset.width}×${preset.height})`}
            >
              <preset.icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ResizablePreviewViewportProps {
  children: React.ReactNode;
}

export function ResizablePreviewViewport({ children }: ResizablePreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);

  const { viewerResponsiveMode, viewerViewportWidth, viewerViewportHeight, viewerGridVisible, viewerGridSpacing, setViewerViewportSize } = useUIStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setAvailableWidth(width);
      setAvailableHeight(height);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!viewerResponsiveMode) {
    return (
      <div ref={containerRef} className="w-full h-full">
        {children}
      </div>
    );
  }

  const maxWidth = Math.max(300, availableWidth - 40);
  const maxHeight = Math.max(300, availableHeight - 40);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 flex items-center justify-center">
      <DimensionLabel
        width={viewerViewportWidth}
        height={viewerViewportHeight}
        onPresetClick={(w, h) => setViewerViewportSize(w, h)}
      />

      <Resizable
        size={{ width: viewerViewportWidth, height: viewerViewportHeight }}
        onResizeStop={(_e, _direction, _ref, d) => {
          setViewerViewportSize(viewerViewportWidth + d.width, viewerViewportHeight + d.height);
        }}
        minWidth={300}
        minHeight={300}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        enable={{ top: false, right: true, bottom: false, left: true, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
        handleStyles={{
          left: { width: '8px', left: '-4px', cursor: 'ew-resize' },
          right: { width: '8px', right: '-4px', cursor: 'ew-resize' },
        }}
        handleClasses={{
          left: 'hover:bg-blue-500 transition-colors',
          right: 'hover:bg-blue-500 transition-colors',
        }}
        className="relative bg-white dark:bg-slate-900"
      >
        {viewerGridVisible && <GridOverlay spacing={viewerGridSpacing} />}
        {children}
      </Resizable>
    </div>
  );
}
