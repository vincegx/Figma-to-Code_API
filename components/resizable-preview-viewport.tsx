'use client';

import { useEffect, useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import { useUIStore } from '@/lib/store/ui-store';

interface ResizablePreviewViewportProps {
  children: React.ReactNode;
}

export function ResizablePreviewViewport({ children }: ResizablePreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);

  const { viewerResponsiveMode, viewerViewportWidth, viewerViewportHeight, setViewerViewportSize } = useUIStore();

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

  // Mode Desktop = pleine largeur, pas de resize
  if (!viewerResponsiveMode) {
    return (
      <div ref={containerRef} className="w-full h-full">
        {children}
      </div>
    );
  }

  // Mode responsive = resize possible
  const maxWidth = Math.max(300, availableWidth - 40);
  const maxHeight = Math.max(300, availableHeight - 40);

  return (
    <div ref={containerRef} className="w-full h-full bg-bg-primary flex items-center justify-center">
      <Resizable
        size={{ width: viewerViewportWidth, height: viewerViewportHeight }}
        onResizeStop={(_e, _direction, _ref, d) => {
          setViewerViewportSize(viewerViewportWidth + d.width, viewerViewportHeight + d.height);
        }}
        minWidth={300}
        minHeight={300}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        enable={{ top: false, right: true, bottom: true, left: true, topRight: false, bottomRight: true, bottomLeft: true, topLeft: false }}
        handleStyles={{
          left: { width: '8px', left: '-4px', cursor: 'ew-resize' },
          right: { width: '8px', right: '-4px', cursor: 'ew-resize' },
          bottom: { height: '8px', bottom: '-4px', cursor: 'ns-resize' },
          bottomRight: { width: '12px', height: '12px', right: '-6px', bottom: '-6px', cursor: 'nwse-resize' },
          bottomLeft: { width: '12px', height: '12px', left: '-6px', bottom: '-6px', cursor: 'nesw-resize' },
        }}
        handleClasses={{
          left: 'hover:bg-blue-500 transition-colors',
          right: 'hover:bg-blue-500 transition-colors',
          bottom: 'hover:bg-blue-500 transition-colors',
          bottomRight: 'hover:bg-blue-500 transition-colors rounded-full',
          bottomLeft: 'hover:bg-blue-500 transition-colors rounded-full',
        }}
        className="relative bg-bg-card overflow-hidden"
      >
        {children}
      </Resizable>
    </div>
  );
}
