'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Resizable } from 're-resizable';
import { useUIStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Monitor,
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  Tablet,
  Copy,
  Check,
  Maximize2,
  X,
  Eye,
  Download,
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import UnifiedTreeView from '@/components/unified-tree-view';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { RulesPanel } from '@/components/rules-panel';
import { cn } from '@/lib/utils';
import type { UnifiedElement } from '@/lib/types/merge';

// Phase 3: Extracted hooks and components
import { useMergeData, useMergeCode } from './_hooks';
import { HierarchyBlock, MergeHeader, MergeCodePanel } from './_components';

// ============================================================================
// Types
// ============================================================================

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

// ============================================================================
// Main Component
// ============================================================================

export default function MergeViewerPage() {
  const params = useParams();
  const mergeId = params.id as string;

  // UI Store for panel collapse and responsive mode
  const {
    viewerResponsiveMode,
    viewerViewportWidth,
    viewerViewportHeight,
    viewerGridVisible,
    viewerGridSpacing,
    viewerLeftPanelCollapsed,
    viewerHighlightEnabled,
    setViewerResponsiveMode,
    setViewerViewportSize,
    setViewerGridVisible,
    setViewerLeftPanelCollapsed,
    setViewerHighlightEnabled,
  } = useUIStore();

  // Ref for LivePreview to send highlight messages
  const livePreviewRef = useRef<LivePreviewHandle>(null);

  // Theme-aware code highlighting
  const currentTheme = useUIStore((state) => state.theme);
  const codeTheme = currentTheme === 'light' ? themes.github : themes.nightOwl;

  // Local UI state
  const [previewFramework, setPreviewFramework] = useState<MergeFrameworkType>('react-tailwind');
  const [withProps, setWithProps] = useState(false);
  const [copiedClasses, setCopiedClasses] = useState(false);
  const [copiedRawData, setCopiedRawData] = useState(false);
  const [rawDataLimit, setRawDataLimit] = useState(2000);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Phase 3: Data hook
  const mergeData = useMergeData({ mergeId });

  // Phase 3: Code generation hook
  const mergeCode = useMergeCode({
    mergeId,
    selectedNode: mergeData.selectedNode,
    previewFramework,
    withProps,
  });

  // Aliases for cleaner code (keeping original variable names)
  const {
    merge,
    isLoading,
    error,
    selectedNodeId,
    setSelectedNodeId,
    multiFrameworkRules,
    hasPrev,
    hasNext,
    goToPrevMerge,
    goToNextMerge,
    unifiedTree,
    googleFontsUrl,
    breakpoints,
    selectedNode,
    displayNode,
  } = mergeData;

  const {
    displayCode,
    displayCss,
    displayAltNode,
    isLoadingCode,
  } = mergeCode;

  // Get generated code for LivePreview (full component)
  const generatedCode = merge?.result?.generatedCode?.[previewFramework] || '';

  // Reset raw data limit when selected node changes
  useEffect(() => {
    setRawDataLimit(2000);
  }, [selectedNodeId]);

  // Send highlight message to iframe when selection changes
  // Use source nodeId (original Figma ID) because that's what's in data-node-id attributes
  useEffect(() => {
    if (!livePreviewRef.current) return;

    // Get the original Figma node ID from sources (mobile first, then tablet, then desktop)
    const sourceNodeId = selectedNode?.sources?.mobile?.nodeId
      || selectedNode?.sources?.tablet?.nodeId
      || selectedNode?.sources?.desktop?.nodeId
      || selectedNodeId;

    const isInstance = selectedNode?.originalType === 'INSTANCE' || selectedNode?.type === 'INSTANCE';

    livePreviewRef.current.sendHighlight(
      sourceNodeId,
      selectedNode?.name || '',
      isInstance,
      viewerHighlightEnabled
    );
  }, [selectedNodeId, selectedNode, viewerHighlightEnabled]);

  // Count applied rules for the selected node (must be before early returns)
  const appliedRulesCount = useMemo(() => {
    if (!displayAltNode || !multiFrameworkRules.length) return 0;
    // Count rules that match the current node type
    return multiFrameworkRules.filter(rule => {
      if (!rule.enabled) return false;
      const selector = rule.selector;
      if (!selector) return false;
      // Simple check: if rule has type selector, match against node type
      if (selector.type && displayAltNode.type !== selector.type) return false;
      return true;
    }).length;
  }, [displayAltNode, multiFrameworkRules]);

  // Extract Tailwind/CSS classes from generated code for selected node
  const nodeClasses = useMemo(() => {
    if (!displayCode) return '';
    // For React: extract first className="..."
    // For HTML: extract first class="..."
    const reactMatch = displayCode.match(/className="([^"]+)"/);
    if (reactMatch) return reactMatch[1];
    const htmlMatch = displayCode.match(/class="([^"]+)"/);
    if (htmlMatch) return htmlMatch[1];
    return '';
  }, [displayCode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-text-secondary">Loading merge...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 bg-bg-primary min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Error loading merge</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            href="/merges"
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block"
          >
            Return to Merges
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!merge) {
    return (
      <div className="container mx-auto px-4 py-8 bg-bg-primary min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Merge not found</h1>
          <p className="text-text-secondary mb-4">
            The merge you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/merges"
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block"
          >
            Return to Merges
          </Link>
        </div>
      </div>
    );
  }

  // Count children
  const countChildren = (node: UnifiedElement | null): number => {
    if (!node?.children) return 0;
    return node.children.length;
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* ========== HEADER ========== */}
      <MergeHeader
        merge={merge}
        mergeId={mergeId}
        displayNodeName={displayNode?.name}
        previewFramework={previewFramework}
        generatedCode={generatedCode}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onFrameworkChange={setPreviewFramework}
        onRefreshPreview={() => setIframeKey((k) => k + 1)}
        goToPrevMerge={goToPrevMerge}
        goToNextMerge={goToNextMerge}
      />

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 overflow-auto p-4">

        {/* ========== ROW 1: Unified Tree + Canvas Preview ========== */}
        <Resizable
          defaultSize={{ width: '100%', height: 600 }}
          minHeight={350}
          enable={{ bottom: true }}
          handleStyles={{
            bottom: {
              height: '20px',
              cursor: 'ns-resize',
              bottom: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }
          }}
          handleComponent={{
            bottom: (
              <div className="w-16 h-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" />
            )
          }}
        >
          <div className="flex h-[calc(100%-20px)]">
            {/* Block: Unified Tree (resizable width) */}
            {!viewerLeftPanelCollapsed ? (
              <Resizable
                defaultSize={{ width: 320, height: '100%' }}
                minWidth={240}
                maxWidth={520}
                enable={{ right: true }}
                handleStyles={{
                  right: {
                    width: '20px',
                    cursor: 'ew-resize',
                    right: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }
                }}
                handleComponent={{
                  right: (
                    <div className="h-16 w-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" />
                  )
                }}
                className="flex-shrink-0"
              >
                <div className="h-full mr-5 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">Unified Tree</span>
                      <button
                        onClick={() => setViewerHighlightEnabled(!viewerHighlightEnabled)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 text-xs rounded',
                          viewerHighlightEnabled ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
                        )}
                      >
                        <Eye className="w-3 h-3" />
                        Inspect
                      </button>
                    </div>
                    <button
                      onClick={() => setViewerLeftPanelCollapsed(true)}
                      className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
                      title="Collapse panel"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <UnifiedTreeView
                      unifiedTree={unifiedTree}
                      selectedNodeId={selectedNodeId}
                      onNodeClick={(id) => setSelectedNodeId(id)}
                    />
                  </div>
                </div>
              </Resizable>
            ) : (
              <div className="w-10 flex-shrink-0 mr-4 bg-bg-card rounded-lg border border-border-primary flex flex-col items-center py-2">
                <button
                  onClick={() => setViewerLeftPanelCollapsed(false)}
                  className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
                  title="Expand panel"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Block: Canvas Preview */}
            <div className="flex-1 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
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
                  <button
                    onClick={() => setIsCanvasFullscreen(true)}
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
                    ref={livePreviewRef}
                    key={iframeKey}
                    code={generatedCode}
                    framework={previewFramework}
                    language={previewFramework === 'html-css' ? 'html' : 'tsx'}
                    breakpoints={breakpoints}
                    googleFontsUrl={googleFontsUrl}
                  />
                </ResizablePreviewViewport>
              </div>
            </div>
          </div>
        </Resizable>

        {/* ========== ROW 2: Generated Code + Node Info ========== */}
        <div className="grid grid-cols-2 gap-4">
          {/* Block: Generated Code */}
          <MergeCodePanel
            displayCode={displayCode}
            displayCss={displayCss}
            generatedCode={generatedCode}
            selectedNodeName={selectedNode?.name}
            mergeName={merge.name}
            previewFramework={previewFramework}
            withProps={withProps}
            isLoadingCode={isLoadingCode}
            onWithPropsChange={setWithProps}
          />

          {/* Block: Node Info + Hierarchy + Layout */}
          <div className="flex flex-col gap-4">
            {/* Node Info */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4">
              <span className="text-sm font-medium text-text-primary mb-4 block">Node Info</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div><span className="text-text-muted text-xs block mb-1">Name</span><span className="text-text-primary text-sm">{displayNode?.name}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Type</span><span className="flex gap-1"><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">div</span><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">{displayNode?.type || 'FRAME'}</span></span></div>
                <div><span className="text-text-muted text-xs block mb-1">ID</span><span className="text-text-primary text-sm font-mono">{displayNode?.sources?.mobile?.nodeId || displayNode?.sources?.tablet?.nodeId || displayNode?.sources?.desktop?.nodeId || displayNode?.id}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Children</span><span className="text-text-primary text-sm">{countChildren(displayNode)} nodes</span></div>
                {/* Sources + Tailwind/CSS Classes side by side */}
                <div>
                  <span className="text-text-muted text-xs block mb-1">Sources</span>
                  <div className="flex items-center gap-2">
                    {merge.sourceNodes.map((source) => (
                      <Link
                        key={source.breakpoint}
                        href={`/viewer/${source.nodeId}`}
                        className="flex items-center gap-1 px-1.5 py-1 bg-bg-secondary rounded text-xs text-text-primary hover:bg-bg-hover transition-colors"
                        title={source.nodeName}
                      >
                        {source.breakpoint === 'mobile' && <Smartphone className="w-3 h-3" />}
                        {source.breakpoint === 'tablet' && <Tablet className="w-3 h-3" />}
                        {source.breakpoint === 'desktop' && <Monitor className="w-3 h-3" />}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-muted text-xs">
                      {previewFramework === 'html-css' ? 'CSS Classes' : 'Tailwind'}
                    </span>
                    {nodeClasses && (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(nodeClasses);
                          setCopiedClasses(true);
                          setTimeout(() => setCopiedClasses(false), 2000);
                        }}
                        className="text-text-muted hover:text-text-primary transition-colors"
                        title="Copy classes"
                      >
                        {copiedClasses ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className="bg-bg-secondary rounded p-1.5 h-10 overflow-auto">
                    <code className="text-xs text-text-primary font-mono break-all leading-relaxed line-clamp-2">
                      {nodeClasses || '—'}
                    </code>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted text-xs block mb-1">Status</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-400 text-sm">Visible</span>
                    <span className="text-text-muted text-sm">•</span>
                    {displayNode?.presence.mobile && <span className="flex items-center gap-1 text-xs text-text-muted"><Smartphone className="w-3 h-3" /></span>}
                    {displayNode?.presence.tablet && <span className="flex items-center gap-1 text-xs text-text-muted"><Tablet className="w-3 h-3" /></span>}
                    {displayNode?.presence.desktop && <span className="flex items-center gap-1 text-xs text-text-muted"><Monitor className="w-3 h-3" /></span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Hierarchy + Layout side by side */}
            <div className="grid grid-cols-2 gap-4">
              <HierarchyBlock node={displayNode} />

              {/* Layout */}
              <div className="bg-bg-card rounded-xl border border-border-primary p-4">
                <span className="text-sm font-medium text-text-primary mb-4 block">Layout</span>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div><span className="text-text-muted text-xs block mb-1">Width</span><span className="text-text-primary text-sm">{Math.round(displayAltNode?.originalNode?.absoluteBoundingBox?.width || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Height</span><span className="text-text-primary text-sm">{Math.round(displayAltNode?.originalNode?.absoluteBoundingBox?.height || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">X</span><span className="text-text-primary text-sm">{Math.round(displayAltNode?.originalNode?.absoluteBoundingBox?.x || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Y</span><span className="text-text-primary text-sm">{Math.round(displayAltNode?.originalNode?.absoluteBoundingBox?.y || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Mode</span><span className="text-text-primary text-sm">{((displayAltNode?.originalNode as any)?.layoutMode || 'NONE').charAt(0) + ((displayAltNode?.originalNode as any)?.layoutMode || 'NONE').slice(1).toLowerCase()}</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Gap</span><span className="text-text-primary text-sm">{(displayAltNode?.originalNode as any)?.itemSpacing || 0}px</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Padding</span><span className="text-text-primary text-sm font-mono tracking-wider">{(displayAltNode?.originalNode as any)?.paddingTop || 0} &nbsp; {(displayAltNode?.originalNode as any)?.paddingRight || 0} &nbsp; {(displayAltNode?.originalNode as any)?.paddingBottom || 0} &nbsp; {(displayAltNode?.originalNode as any)?.paddingLeft || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ROW 3: Appearance/Constraints + Unified Element Data + Rules ========== */}
        <div className="grid grid-cols-3 gap-4 mt-4 pb-6 items-stretch">
          {/* Column 1: Appearance + Constraints */}
          <div className="flex flex-col gap-4">
            {/* Appearance */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Appearance</span>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-x-8">
                  <div><span className="text-text-muted text-xs block mb-1">Fills</span><span className="text-text-primary text-sm">{(displayAltNode?.originalNode as any)?.fills?.length || 0} fill(s)</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Blend Mode</span><span className="text-text-primary text-sm">{((displayAltNode?.originalNode as any)?.blendMode || 'PASS_THROUGH').split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</span></div>
                </div>
                <div><span className="text-text-muted text-xs block mb-1">Opacity</span><span className="text-text-primary text-sm">{Math.round(((displayAltNode?.originalNode as any)?.opacity ?? 1) * 100)}%</span></div>
              </div>
            </div>

            {/* Constraints */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Constraints</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div><span className="text-text-muted text-xs block mb-1">Horizontal</span><span className="text-text-primary text-sm">{(displayAltNode?.originalNode?.constraints?.horizontal || 'LEFT').charAt(0) + (displayAltNode?.originalNode?.constraints?.horizontal || 'LEFT').slice(1).toLowerCase()}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Vertical</span><span className="text-text-primary text-sm">{(displayAltNode?.originalNode?.constraints?.vertical || 'TOP').charAt(0) + (displayAltNode?.originalNode?.constraints?.vertical || 'TOP').slice(1).toLowerCase()}</span></div>
                <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Clipping</span><span className="flex items-center gap-1 text-sm">{(displayAltNode?.originalNode as any)?.clipsContent ? (<><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-400">Yes</span></>) : (<><span className="w-2 h-2 rounded-full bg-text-muted" /><span className="text-text-muted">No</span></>)}</span></div>
              </div>
            </div>
          </div>

          {/* Column 2: Unified Element Data */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm font-medium text-text-primary">Unified Element Data</span>
              <div className="flex items-center gap-1">
                <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(displayNode, null, 2) || '{}'); setCopiedRawData(true); setTimeout(() => setCopiedRawData(false), 2000); }} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Copy to clipboard">{copiedRawData ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => {
                  const jsonData = JSON.stringify(displayNode, null, 2) || '{}';
                  const blob = new Blob([jsonData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${displayNode?.name || 'unified-element'}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Download JSON"><Download className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Highlight
                theme={codeTheme}
                code={(() => {
                  const fullJson = JSON.stringify(displayNode, null, 2) || '{}';
                  if (rawDataLimit >= fullJson.length) return fullJson;
                  const sliced = fullJson.slice(0, rawDataLimit);
                  const lastNewline = sliced.lastIndexOf('\n');
                  return lastNewline > 0 ? sliced.slice(0, lastNewline) + '\n  // ... more data' : sliced;
                })()}
                language="json"
              >
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre className="text-xs rounded-lg p-3 overflow-auto h-64 font-mono leading-5" style={{ ...style, background: 'transparent' }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
            <div className="flex items-center justify-between mt-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-full bg-graph-2" />
                <span>No errors</span>
                <span>•</span>
                <span>{JSON.stringify(displayNode, null, 2)?.split('\n').length || 0} lines</span>
              </div>
              {(() => {
                const jsonLength = JSON.stringify(displayNode, null, 2)?.length || 0;
                const hasMore = jsonLength > rawDataLimit;
                return hasMore ? (
                  <button
                    onClick={() => setRawDataLimit(prev => prev + 10000)}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                  >
                    + more ({Math.round((rawDataLimit / jsonLength) * 100)}%)
                  </button>
                ) : null;
              })()}
            </div>
          </div>

          {/* Column 3: Rules */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-primary">Rules</span>
              <span className="text-xs text-text-muted">Applied rules <span className="text-text-primary">{appliedRulesCount}/{multiFrameworkRules.length}</span></span>
            </div>
            <RulesPanel
              node={displayAltNode}
              selectedFramework={previewFramework}
              allRules={multiFrameworkRules}
            />
          </div>
        </div>
      </main>

      {/* ========== FULLSCREEN CANVAS PREVIEW ========== */}
      {isCanvasFullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-bg-card">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
              <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
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
              <button
                onClick={() => setIsCanvasFullscreen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
                title="Exit fullscreen"
              >
                <X className="w-4 h-4" />
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
                key={`fullscreen-${iframeKey}`}
                code={generatedCode}
                framework={previewFramework}
                language={previewFramework === 'html-css' ? 'html' : 'tsx'}
                breakpoints={breakpoints}
                googleFontsUrl={googleFontsUrl}
              />
            </ResizablePreviewViewport>
          </div>
        </div>
      )}
    </div>
  );
}
