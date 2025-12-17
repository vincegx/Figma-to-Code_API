'use client';

/**
 * MergeViewerPage
 *
 * Main page for viewing a responsive merge with unified tree, canvas preview,
 * generated code, and node info panels.
 *
 * Phase 3 refactoring - reduced from 720 to ~300 lines via component extraction
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Resizable } from 're-resizable';
import { useUIStore } from '@/lib/store';
import { themes } from 'prism-react-renderer';
import type { LivePreviewHandle } from '@/components/live-preview';
import { RulesPanel } from '@/components/rules-panel';
import { SplitModal } from '@/components/split/split-modal';
import type { UnifiedElement } from '@/lib/types/merge';

// Phase 3: Extracted hooks and components
import { useMergeData, useMergeCode } from './_hooks';
import {
  HierarchyBlock,
  MergeHeader,
  MergeCodePanel,
  TreePanel,
  CanvasPreviewBlock,
  NodeInfoBlock,
  UnifiedElementDataBlock,
} from './_components';

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

  // Framework for preview (loads from Settings)
  const [previewFramework, setPreviewFramework] = useState<MergeFrameworkType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const settings = localStorage.getItem('app-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          const framework = parsed.defaultFramework;
          if (framework === 'react-tailwind' || framework === 'react-tailwind-v4' || framework === 'html-css') {
            return framework as MergeFrameworkType;
          }
        }
      } catch { /* ignore */ }
    }
    return 'react-tailwind';
  });

  // Language for export (loads from Settings)
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
  const [withProps, setWithProps] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [splitModalOpen, setSplitModalOpen] = useState(false);

  // Phase 3: Data hook
  const mergeData = useMergeData({ mergeId });

  // Phase 3: Code generation hook
  const mergeCode = useMergeCode({
    mergeId,
    selectedNode: mergeData.selectedNode,
    previewFramework,
    withProps,
  });

  // Aliases for cleaner code
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

  const { displayCode, displayCss, displayAltNode, isLoadingCode } = mergeCode;

  // Get generated code for LivePreview (full component)
  const generatedCode = merge?.result?.generatedCode?.[previewFramework] || '';

  // Send highlight message to iframe when selection changes
  useEffect(() => {
    if (!livePreviewRef.current) return;
    const sourceNodeId = selectedNode?.sources?.mobile?.nodeId
      || selectedNode?.sources?.tablet?.nodeId
      || selectedNode?.sources?.desktop?.nodeId
      || selectedNodeId;
    const isInstance = selectedNode?.originalType === 'INSTANCE' || selectedNode?.type === 'INSTANCE';
    livePreviewRef.current.sendHighlight(sourceNodeId, selectedNode?.name || '', isInstance, viewerHighlightEnabled);
  }, [selectedNodeId, selectedNode, viewerHighlightEnabled]);

  // Count applied rules for the selected node
  const appliedRulesCount = useMemo(() => {
    if (!displayAltNode || !multiFrameworkRules.length) return 0;
    return multiFrameworkRules.filter(rule => {
      if (!rule.enabled) return false;
      const selector = rule.selector;
      if (!selector) return false;
      if (selector.type && displayAltNode.type !== selector.type) return false;
      return true;
    }).length;
  }, [displayAltNode, multiFrameworkRules]);

  // Extract Tailwind/CSS classes from generated code for selected node
  const nodeClasses = useMemo(() => {
    if (!displayCode) return '';
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
          <Link href="/merges" className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block">
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
          <p className="text-text-secondary mb-4">The merge you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/merges" className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block">
            Return to Merges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
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
        onSplitClick={() => setSplitModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {/* Row 1: Unified Tree + Canvas Preview */}
        <Resizable
          defaultSize={{ width: '100%', height: '80vh' }}
          minHeight={350}
          enable={{ bottom: true }}
          handleStyles={{ bottom: { height: '20px', cursor: 'ns-resize', bottom: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }}
          handleComponent={{ bottom: <div className="w-16 h-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" /> }}
        >
          <div className="flex h-[calc(100%-20px)]">
            <TreePanel
              unifiedTree={unifiedTree}
              selectedNodeId={selectedNodeId}
              onNodeClick={setSelectedNodeId}
              isCollapsed={viewerLeftPanelCollapsed}
              onCollapseChange={setViewerLeftPanelCollapsed}
              highlightEnabled={viewerHighlightEnabled}
              onHighlightChange={setViewerHighlightEnabled}
            />
            <CanvasPreviewBlock
              livePreviewRef={livePreviewRef}
              iframeKey={iframeKey}
              generatedCode={generatedCode}
              previewFramework={previewFramework}
              breakpoints={breakpoints}
              googleFontsUrl={googleFontsUrl}
              viewerResponsiveMode={viewerResponsiveMode}
              viewerViewportWidth={viewerViewportWidth}
              viewerViewportHeight={viewerViewportHeight}
              viewerGridVisible={viewerGridVisible}
              viewerGridSpacing={viewerGridSpacing}
              setViewerResponsiveMode={setViewerResponsiveMode}
              setViewerViewportSize={setViewerViewportSize}
              setViewerGridVisible={setViewerGridVisible}
            />
          </div>
        </Resizable>

        {/* Row 2: Generated Code + Node Info */}
        <div className="grid grid-cols-2 gap-4">
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

          <div className="flex flex-col gap-4">
            <NodeInfoBlock
              displayNode={displayNode}
              sourceNodes={merge.sourceNodes}
              nodeClasses={nodeClasses}
              previewFramework={previewFramework}
            />

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

        {/* Row 3: Appearance/Constraints + Unified Element Data + Rules */}
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
          <UnifiedElementDataBlock
            displayNode={displayNode}
            codeTheme={codeTheme}
            selectedNodeId={selectedNodeId}
          />

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

      {/* Split Modal */}
      <SplitModal
        open={splitModalOpen}
        onOpenChange={setSplitModalOpen}
        mergeId={mergeId}
        mergeName={merge.name}
        unifiedTree={unifiedTree}
        framework={previewFramework}
        language={exportLanguage}
      />
    </div>
  );
}
