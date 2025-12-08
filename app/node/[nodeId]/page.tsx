'use client';

/**
 * Viewer Page
 *
 * Main page for viewing and editing Figma nodes with code generation.
 * Phase 3 refactoring: hooks and components extracted to _hooks/ and _components/
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Resizable } from 're-resizable';
import { useUIStore } from '@/lib/store';
import {
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Copy,
  Check,
  X,
  Monitor,
  Smartphone,
  Tablet,
  Grid3x3,
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { RefetchDialog } from '@/components/refetch-dialog';
import FigmaTreeView from '@/components/figma-tree-view';
import { RulesPanel } from '@/components/rules-panel';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { cn } from '@/lib/utils';
import type { FrameworkType } from '@/lib/types/rules';

// Phase 3: Extracted hooks and components
import { useViewerData, useCodeGeneration } from './_hooks';
import { ViewerHeader, PreviewCanvas, CodePanel, NodeInfoPanel } from './_components';

export default function ViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const nodeId = params.nodeId as string;
  const startFullscreen = searchParams.get('fullscreen') === 'true';

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

  // WP35: Ref for LivePreview to send highlight messages
  const livePreviewRef = useRef<LivePreviewHandle>(null);

  // WP38: Theme-aware code highlighting
  const currentTheme = useUIStore((state) => state.theme);
  const codeTheme = currentTheme === 'light' ? themes.github : themes.nightOwl;

  // Framework for preview (loads from Settings)
  const [previewFramework, setPreviewFramework] = useState<FrameworkType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const settings = localStorage.getItem('app-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          const framework = parsed.defaultFramework;
          if (framework === 'react-tailwind' || framework === 'react-tailwind-v4' || framework === 'html-css') {
            return framework as FrameworkType;
          }
        }
      } catch { /* ignore */ }
    }
    return 'react-tailwind';
  });

  // Language for export
  const [exportLanguage, setExportLanguage] = useState<'typescript' | 'javascript'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const settings = localStorage.getItem('app-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.defaultLanguage === 'javascript' || parsed.defaultLanguage === 'typescript') {
            return parsed.defaultLanguage;
          }
        }
      } catch { /* ignore */ }
    }
    return 'typescript';
  });

  // Local UI state
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(startFullscreen);
  const [withProps, setWithProps] = useState(false);
  const [rawDataLimit, setRawDataLimit] = useState(2000);
  const [copiedRawData, setCopiedRawData] = useState(false);

  // Data hook
  const viewerData = useViewerData({
    nodeId,
    previewFramework,
    iframeKey,
    onIframeKeyChange: () => setIframeKey(k => k + 1),
  });

  // Code generation hook
  const codeGen = useCodeGeneration({
    nodeId,
    altNode: viewerData.altNode,
    selectedNode: viewerData.selectedNode,
    multiFrameworkRules: viewerData.multiFrameworkRules,
    previewFramework,
    rootResolvedProperties: viewerData.rootResolvedProperties as Record<string, string>,
    iframeKey,
    withProps,
    selectedVersionFolder: viewerData.selectedVersionFolder,
  });

  // Reset raw data limit when selected node changes
  useEffect(() => {
    setRawDataLimit(2000);
  }, [viewerData.selectedTreeNodeId]);

  // WP35: Send highlight message to iframe when selection changes
  useEffect(() => {
    if (!livePreviewRef.current) return;
    const isInstance = viewerData.selectedNode?.type === 'INSTANCE' || viewerData.selectedNode?.originalType === 'INSTANCE';
    livePreviewRef.current.sendHighlight(
      viewerData.selectedTreeNodeId,
      viewerData.selectedNode?.name || '',
      isInstance,
      viewerHighlightEnabled
    );
  }, [viewerData.selectedTreeNodeId, viewerData.selectedNode?.name, viewerData.selectedNode?.type, viewerData.selectedNode?.originalType, viewerHighlightEnabled]);

  // Loading state
  if (!viewerData.isLibraryLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-text-secondary">Loading...</span>
      </div>
    );
  }

  // Node not found
  if (!viewerData.currentNode) {
    return (
      <div className="container mx-auto px-4 py-8 bg-bg-primary min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Node not found</h1>
          <p className="text-text-secondary mb-4">The node doesn&apos;t exist or hasn&apos;t been imported yet.</p>
          <Link href="/nodes" className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* HEADER */}
      <ViewerHeader
        nodeId={nodeId}
        nodeName={viewerData.currentNode.name}
        displayNodeName={viewerData.displayNode?.name}
        selectedVersionFolder={viewerData.selectedVersionFolder}
        iframeKey={iframeKey}
        previewFramework={previewFramework}
        exportLanguage={exportLanguage}
        generatedCode={codeGen.generatedCode}
        prevNode={viewerData.prevNode}
        nextNode={viewerData.nextNode}
        isRefetching={viewerData.isRefetching}
        onVersionSelect={viewerData.handleVersionSelect}
        onRefetchClick={() => viewerData.setRefetchDialogOpen(true)}
        onRefreshPreview={() => setIframeKey(k => k + 1)}
        onFrameworkChange={setPreviewFramework}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto p-4">
        {/* ROW 1: Figma Tree + Canvas Preview */}
        <Resizable
          defaultSize={{ width: '100%', height: '80vh' }}
          minHeight={350}
          enable={{ bottom: true }}
          handleStyles={{ bottom: { height: '20px', cursor: 'ns-resize', bottom: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}}
          handleComponent={{ bottom: <div className="w-16 h-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" /> }}
        >
          <div className="flex h-[calc(100%-20px)]">
            {/* Figma Tree Panel */}
            {!viewerLeftPanelCollapsed ? (
              <Resizable
                defaultSize={{ width: 320, height: '100%' }}
                minWidth={240}
                maxWidth={520}
                enable={{ right: true }}
                handleStyles={{ right: { width: '20px', cursor: 'ew-resize', right: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}}
                handleComponent={{ right: <div className="h-16 w-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" /> }}
                className="flex-shrink-0"
              >
                <div className="h-full mr-5 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">Figma Tree</span>
                      <button
                        onClick={() => setViewerHighlightEnabled(!viewerHighlightEnabled)}
                        className={cn('flex items-center gap-1 px-2 py-0.5 text-xs rounded', viewerHighlightEnabled ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')}
                      >
                        <Eye className="w-3 h-3" />
                        Inspect
                      </button>
                    </div>
                    <button onClick={() => setViewerLeftPanelCollapsed(true)} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Collapse panel">
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <FigmaTreeView altNode={viewerData.altNode} selectedNodeId={viewerData.selectedTreeNodeId} onNodeClick={(id) => viewerData.setSelectedTreeNodeId(id)} />
                  </div>
                </div>
              </Resizable>
            ) : (
              <div className="w-10 flex-shrink-0 mr-4 bg-bg-card rounded-lg border border-border-primary flex flex-col items-center py-2">
                <button onClick={() => setViewerLeftPanelCollapsed(false)} className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Expand panel">
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canvas Preview */}
            <PreviewCanvas
              ref={livePreviewRef}
              iframeKey={iframeKey}
              generatedCode={codeGen.generatedCode}
              previewFramework={previewFramework}
              googleFontsUrl={codeGen.googleFontsUrl}
              viewerResponsiveMode={viewerResponsiveMode}
              viewerViewportWidth={viewerViewportWidth}
              viewerViewportHeight={viewerViewportHeight}
              viewerGridVisible={viewerGridVisible}
              viewerGridSpacing={viewerGridSpacing}
              onResponsiveModeChange={setViewerResponsiveMode}
              onViewportSizeChange={setViewerViewportSize}
              onGridVisibleChange={setViewerGridVisible}
              onFullscreenClick={() => setIsCanvasFullscreen(true)}
            />
          </div>
        </Resizable>

        {/* ROW 2: Generated Code + Node Info */}
        <div className="grid grid-cols-2 gap-4 items-stretch">
          <CodePanel
            displayCode={codeGen.displayCode}
            displayCss={codeGen.displayCss}
            displayNodeName={viewerData.displayNode?.name}
            nodeName={viewerData.currentNode.name}
            previewFramework={previewFramework}
            withProps={withProps}
            onWithPropsChange={setWithProps}
          />
          <NodeInfoPanel
            displayNode={viewerData.displayNode}
            nodeClasses={codeGen.nodeClasses}
            previewFramework={previewFramework}
          />
        </div>

        {/* ROW 3: Appearance/Constraints + Raw Data + Rules */}
        <div className="grid grid-cols-3 gap-4 mt-4 pb-6 items-stretch">
          {/* Appearance + Constraints */}
          <div className="flex flex-col gap-4">
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Appearance</span>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-x-8">
                  <div><span className="text-text-muted text-xs block mb-1">Fills</span><span className="text-text-primary text-sm">{(viewerData.displayNode?.originalNode as any)?.fills?.length || 0} fill(s)</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Blend Mode</span><span className="text-text-primary text-sm">{((viewerData.displayNode?.originalNode as any)?.blendMode || 'PASS_THROUGH').split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</span></div>
                </div>
                <div><span className="text-text-muted text-xs block mb-1">Opacity</span><span className="text-text-primary text-sm">{Math.round(((viewerData.displayNode?.originalNode as any)?.opacity ?? 1) * 100)}%</span></div>
              </div>
            </div>
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Constraints</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div><span className="text-text-muted text-xs block mb-1">Horizontal</span><span className="text-text-primary text-sm">{(viewerData.displayNode?.originalNode?.constraints?.horizontal || 'LEFT').charAt(0) + (viewerData.displayNode?.originalNode?.constraints?.horizontal || 'LEFT').slice(1).toLowerCase()}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Vertical</span><span className="text-text-primary text-sm">{(viewerData.displayNode?.originalNode?.constraints?.vertical || 'TOP').charAt(0) + (viewerData.displayNode?.originalNode?.constraints?.vertical || 'TOP').slice(1).toLowerCase()}</span></div>
                <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Clipping</span><span className="flex items-center gap-1 text-sm">{(viewerData.displayNode?.originalNode as any)?.clipsContent ? (<><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-400">Yes</span></>) : (<><span className="w-2 h-2 rounded-full bg-text-muted" /><span className="text-text-muted">No</span></>)}</span></div>
              </div>
            </div>
          </div>

          {/* Raw Figma Data */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm font-medium text-text-primary">Raw figma data</span>
              <div className="flex items-center gap-1">
                <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(viewerData.displayNode, null, 2) || '{}'); setCopiedRawData(true); setTimeout(() => setCopiedRawData(false), 2000); }} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Copy">{copiedRawData ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => { const jsonData = JSON.stringify(viewerData.displayNode, null, 2) || '{}'; const blob = new Blob([jsonData], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${viewerData.displayNode?.name || 'figma-data'}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Download"><Download className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Highlight theme={codeTheme} code={(() => { const fullJson = JSON.stringify(viewerData.displayNode, null, 2) || '{}'; if (rawDataLimit >= fullJson.length) return fullJson; const sliced = fullJson.slice(0, rawDataLimit); const lastNewline = sliced.lastIndexOf('\n'); return lastNewline > 0 ? sliced.slice(0, lastNewline) + '\n  // ... more data' : sliced; })()} language="json">
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre className="text-xs rounded-lg p-3 overflow-auto h-64 font-mono leading-5" style={{ ...style, background: 'transparent' }}>
                    {tokens.map((line, i) => (<div key={i} {...getLineProps({ line })}>{line.map((token, key) => (<span key={key} {...getTokenProps({ token })} />))}</div>))}
                  </pre>
                )}
              </Highlight>
            </div>
            <div className="flex items-center justify-between mt-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-graph-2" /><span>No errors</span><span>•</span><span>{JSON.stringify(viewerData.displayNode, null, 2)?.split('\n').length || 0} lines</span></div>
              {(() => { const jsonLength = JSON.stringify(viewerData.displayNode, null, 2)?.length || 0; return jsonLength > rawDataLimit ? (<button onClick={() => setRawDataLimit(prev => prev + 10000)} className="text-xs text-text-muted hover:text-text-primary">+ more ({Math.round((rawDataLimit / jsonLength) * 100)}%)</button>) : null; })()}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-primary">Rules</span>
              <span className="text-xs text-text-muted">Applied rules <span className="text-text-primary">{viewerData.appliedRulesCount}/{viewerData.multiFrameworkRules.length}</span></span>
            </div>
            <RulesPanel node={viewerData.selectedNode} selectedFramework={previewFramework} allRules={viewerData.multiFrameworkRules} />
          </div>
        </div>
      </main>

      {/* DIALOGS */}
      <RefetchDialog
        open={viewerData.refetchDialogOpen}
        onOpenChange={async (open) => {
          viewerData.setRefetchDialogOpen(open);
          if (!open && viewerData.refetchResult && viewerData.refetchResult.status !== 'up_to_date' && viewerData.refetchResult.status !== 'error') {
            await viewerData.handleRefetchComplete();
          }
        }}
        nodeId={nodeId}
        nodeName={viewerData.currentNode.name}
        lastSyncDate={viewerData.currentNode.lastModified}
        onRefetch={async () => { await viewerData.refetch(); }}
        isRefetching={viewerData.isRefetching}
        progress={viewerData.progress}
        result={viewerData.refetchResult}
        error={viewerData.refetchError}
        onReset={viewerData.resetRefetch}
      />

      {/* FULLSCREEN CANVAS */}
      {isCanvasFullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-bg-card">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
              <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
              <div className="flex items-center gap-0.5 p-0.5 bg-bg-secondary rounded">
                <button onClick={() => { setViewerResponsiveMode(true); setViewerViewportSize(375, 667); }} className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 375 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')} title="Mobile"><Smartphone className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setViewerResponsiveMode(true); setViewerViewportSize(768, 1024); }} className={cn('w-6 h-6 flex items-center justify-center rounded', viewerResponsiveMode && viewerViewportWidth === 768 ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')} title="Tablet"><Tablet className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewerResponsiveMode(false)} className={cn('w-6 h-6 flex items-center justify-center rounded', !viewerResponsiveMode ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary')} title="Desktop"><Monitor className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewerResponsiveMode(!viewerResponsiveMode)} className={cn('w-7 h-7 flex items-center justify-center rounded', viewerResponsiveMode ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')} title="Responsive"><Copy className="w-4 h-4" /></button>
              <button onClick={() => setViewerGridVisible(!viewerGridVisible)} className={cn('w-7 h-7 flex items-center justify-center rounded', viewerGridVisible ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover')} title="Grid"><Grid3x3 className="w-4 h-4" /></button>
              <button onClick={() => setIsCanvasFullscreen(false)} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Exit fullscreen"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 relative bg-bg-secondary">
            <ResizablePreviewViewport>
              {viewerGridVisible && (<div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: `repeating-linear-gradient(0deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px), repeating-linear-gradient(90deg, rgb(148 163 184 / 0.1) 0px, transparent 1px, transparent ${viewerGridSpacing}px)` }} />)}
              <LivePreview key={`fullscreen-${iframeKey}`} code={codeGen.generatedCode} framework={previewFramework} language={previewFramework === 'html-css' ? 'html' : 'tsx'} googleFontsUrl={codeGen.googleFontsUrl} />
            </ResizablePreviewViewport>
          </div>
        </div>
      )}
    </div>
  );
}
