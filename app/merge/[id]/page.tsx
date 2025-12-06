'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ChevronRight,
  RefreshCw,
  Download,
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
  Home,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UnifiedTreeView from '@/components/unified-tree-view';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { cn } from '@/lib/utils';
import type { Merge, UnifiedElement } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

// ============================================================================
// Helper: Find node in unified tree
// ============================================================================

function findNodeInTree(tree: UnifiedElement, nodeId: string): UnifiedElement | null {
  if (tree.id === nodeId) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeInTree(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// ============================================================================
// Hierarchy Block Component
// ============================================================================

function HierarchyBlock({ node }: { node: UnifiedElement | null }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const children = node?.children || [];
  const childCount = children.length;

  const renderNode = (child: UnifiedElement, depth: number = 0) => {
    const hasChildren = child.children && child.children.length > 0;
    const isExpanded = expandedIds.has(child.id);

    return (
      <div key={child.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded text-xs cursor-pointer transition-colors",
            "hover:bg-bg-hover"
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
          onClick={() => hasChildren && toggleExpand(child.id)}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "w-3 h-3 text-text-muted transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <span className="w-3 h-3" />
          )}
          <span className="text-text-primary">{child.name}</span>
          {/* Breakpoint indicators */}
          <div className="flex items-center gap-0.5 ml-auto">
            {child.presence.mobile && <Smartphone className="w-3 h-3 text-text-muted" />}
            {child.presence.tablet && <Tablet className="w-3 h-3 text-text-muted" />}
            {child.presence.desktop && <Monitor className="w-3 h-3 text-text-muted" />}
          </div>
        </div>
        {isExpanded && child.children && (
          <div>
            {child.children.slice(0, 10).map(subChild => renderNode(subChild as UnifiedElement, depth + 1))}
            {child.children.length > 10 && (
              <div className="text-xs text-text-muted px-3 py-1" style={{ paddingLeft: `${24 + depth * 12}px` }}>
                +{child.children.length - 10} more...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4">
      <span className="text-sm font-medium text-text-primary mb-4 block">Hierarchy</span>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-text-muted">Children</span>
        <span className="text-text-primary">{childCount} nodes</span>
      </div>
      <div className="space-y-1 h-[140px] overflow-auto">
        {children.slice(0, 10).map(child => renderNode(child as UnifiedElement))}
        {children.length > 10 && (
          <div className="text-xs text-text-muted px-3 py-1">
            +{children.length - 10} more...
          </div>
        )}
        {children.length === 0 && (
          <div className="text-xs text-text-muted">No children</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MergeViewerPage() {
  const params = useParams();
  const router = useRouter();
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

  // State
  const [merge, setMerge] = useState<Merge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [previewFramework, setPreviewFramework] = useState<MergeFrameworkType>('react-tailwind');
  const [codeActiveTab, setCodeActiveTab] = useState<'component' | 'styles'>('component');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRawData, setCopiedRawData] = useState(false);
  const [rawDataLimit, setRawDataLimit] = useState(2000);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Load merge data
  useEffect(() => {
    async function loadMerge() {
      if (!mergeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/merges/${mergeId}`);
        if (!response.ok) {
          throw new Error(`Failed to load merge: ${response.statusText}`);
        }
        const data = await response.json();
        setMerge(data.merge);

        // Select root node by default
        if (data.merge?.result?.unifiedTree) {
          setSelectedNodeId(data.merge.result.unifiedTree.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    loadMerge();
  }, [mergeId]);

  // Get unified tree and generated code
  const unifiedTree = merge?.result?.unifiedTree || null;
  const generatedCode = merge?.result?.generatedCode?.[previewFramework] || '';
  // WP08: Get Google Fonts URL for font loading
  const googleFontsUrl = merge?.result?.googleFontsUrl;

  // WP08: Extract breakpoints from merge sourceNodes for responsive CSS
  const breakpoints = useMemo(() => {
    if (!merge?.sourceNodes) return undefined;
    const mobileNode = merge.sourceNodes.find(n => n.breakpoint === 'mobile');
    const tabletNode = merge.sourceNodes.find(n => n.breakpoint === 'tablet');
    if (!mobileNode || !tabletNode) return undefined;
    return {
      mobileWidth: mobileNode.width,
      tabletWidth: tabletNode.width,
    };
  }, [merge?.sourceNodes]);

  // Find selected node in tree
  const selectedNode = useMemo(() => {
    if (!unifiedTree || !selectedNodeId) return null;
    return findNodeInTree(unifiedTree, selectedNodeId);
  }, [unifiedTree, selectedNodeId]);

  // Display node (selected or root)
  const displayNode = selectedNode || unifiedTree;

  // Reset raw data limit when selected node changes
  useEffect(() => {
    setRawDataLimit(2000);
  }, [selectedNodeId]);

  // Send highlight message to iframe when selection changes
  useEffect(() => {
    if (!livePreviewRef.current) return;

    livePreviewRef.current.sendHighlight(
      selectedNodeId,
      selectedNode?.name || '',
      false,
      viewerHighlightEnabled
    );
  }, [selectedNodeId, selectedNode?.name, viewerHighlightEnabled]);

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

  // Stats from merge result
  const stats = merge.result?.stats;
  const warnings = merge.result?.warnings || [];

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* ========== HEADER ========== */}
      <header className="flex-shrink-0 flex justify-between px-5 py-3">
        {/* Left: Title + Breadcrumb */}
        <div>
          <div className="flex items-center gap-4 mb-1">
            <h1 className="text-2xl font-semibold text-text-primary">{merge.name}</h1>
            <span className={cn(
              'px-2 py-0.5 text-xs rounded',
              merge.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
              merge.status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            )}>
              {merge.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-text-muted hover:text-text-primary"><Home className="w-4 h-4" /></Link>
            <ChevronRight className="w-4 h-4 text-text-muted" />
            <Link href="/merges" className="text-text-muted hover:text-text-primary">Merges</Link>
            <ChevronRight className="w-4 h-4 text-text-muted" />
            <span className="text-text-primary">{displayNode?.name || merge.name}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Export">
                  <Download className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-bg-card border border-border-primary">
                <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(generatedCode); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const ext = previewFramework === 'html-css' ? 'html' : 'tsx';
                  const blob = new Blob([generatedCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${merge.name}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Code File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={previewFramework} onValueChange={(v) => setPreviewFramework(v as MergeFrameworkType)}>
              <SelectTrigger className="h-8 w-[160px] bg-bg-secondary border-border-primary text-xs text-text-muted hover:bg-bg-hover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-card border border-border-primary">
                <SelectItem value="react-tailwind" className="text-xs">React + Tailwind</SelectItem>
                <SelectItem value="react-tailwind-v4" className="text-xs">React + Tailwind v4</SelectItem>
                <SelectItem value="html-css" className="text-xs">HTML + CSS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

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
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Block: Generated Code */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">Generated Code</span>
                <button
                  onClick={() => setCodeActiveTab('component')}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded transition-colors',
                    codeActiveTab === 'component' ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
                  )}
                >
                  Component
                </button>
                <button
                  onClick={() => setCodeActiveTab('styles')}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded transition-colors',
                    codeActiveTab === 'styles' ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
                  )}
                >
                  Styles
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
                  title="Copy to clipboard"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    const ext = previewFramework === 'html-css' ? 'html' : 'tsx';
                    const blob = new Blob([generatedCode], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${merge.name}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
                  title="Download file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Highlight
                theme={codeTheme}
                code={generatedCode}
                language={previewFramework === 'html-css' ? 'markup' : 'tsx'}
              >
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre className="text-xs rounded-lg p-4 overflow-auto max-h-[420px] font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>No errors</span>
              <span>•</span>
              <span>{generatedCode.split('\n').length} lines</span>
            </div>
          </div>

          {/* Block: Node Info + Hierarchy + Stats */}
          <div className="flex flex-col gap-4">
            {/* Node Info */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4">
              <span className="text-sm font-medium text-text-primary mb-4 block">Element Info</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div><span className="text-text-muted text-xs block mb-1">Name</span><span className="text-text-primary text-sm">{displayNode?.name}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Type</span><span className="flex gap-1"><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">div</span><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">{displayNode?.type || 'FRAME'}</span></span></div>
                <div><span className="text-text-muted text-xs block mb-1">ID</span><span className="text-text-primary text-sm font-mono">{displayNode?.id}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Children</span><span className="text-text-primary text-sm">{countChildren(displayNode)} nodes</span></div>
                <div className="col-span-2">
                  <span className="text-text-muted text-xs block mb-1">Presence</span>
                  <div className="flex items-center gap-2">
                    {displayNode?.presence.mobile && <span className="flex items-center gap-1 text-xs"><Smartphone className="w-3 h-3" /> Mobile</span>}
                    {displayNode?.presence.tablet && <span className="flex items-center gap-1 text-xs"><Tablet className="w-3 h-3" /> Tablet</span>}
                    {displayNode?.presence.desktop && <span className="flex items-center gap-1 text-xs"><Monitor className="w-3 h-3" /> Desktop</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Hierarchy + Stats side by side */}
            <div className="grid grid-cols-2 gap-4">
              <HierarchyBlock node={displayNode} />

              {/* Merge Stats */}
              <div className="bg-bg-card rounded-xl border border-border-primary p-4">
                <span className="text-sm font-medium text-text-primary mb-4 block">Merge Stats</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div><span className="text-text-muted text-xs block mb-1">Total Elements</span><span className="text-text-primary text-sm">{stats?.totalElements || 0}</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Common</span><span className="text-text-primary text-sm">{stats?.commonElements || 0}</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Unique</span><span className="text-text-primary text-sm">{(stats?.uniqueElements?.mobile || 0) + (stats?.uniqueElements?.tablet || 0) + (stats?.uniqueElements?.desktop || 0)}</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Warnings</span><span className={cn("text-sm", warnings.length > 0 ? "text-amber-400" : "text-text-primary")}>{warnings.length}</span></div>
                </div>
                {warnings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-primary">
                    <div className="flex items-center gap-1 text-xs text-amber-400 mb-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Warnings</span>
                    </div>
                    <ul className="text-xs text-text-muted space-y-1 max-h-20 overflow-auto">
                      {warnings.slice(0, 5).map((w, i) => (
                        <li key={i}>• {w.message}</li>
                      ))}
                      {warnings.length > 5 && (
                        <li className="text-text-muted">+{warnings.length - 5} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========== ROW 3: Source Nodes + Raw Data ========== */}
        <div className="grid grid-cols-2 gap-4 mt-4 pb-6">
          {/* Source Nodes */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4">
            <span className="text-sm font-medium text-text-primary mb-4 block">Source Nodes</span>
            <div className="grid grid-cols-3 gap-4">
              {merge.sourceNodes.map((source) => (
                <div key={source.breakpoint} className="bg-bg-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {source.breakpoint === 'mobile' && <Smartphone className="w-4 h-4 text-text-muted" />}
                    {source.breakpoint === 'tablet' && <Tablet className="w-4 h-4 text-text-muted" />}
                    {source.breakpoint === 'desktop' && <Monitor className="w-4 h-4 text-text-muted" />}
                    <span className="text-sm font-medium text-text-primary capitalize">{source.breakpoint}</span>
                  </div>
                  <div className="text-xs text-text-muted truncate">{source.nodeName}</div>
                  <div className="text-xs text-text-muted mt-1">{source.width}px</div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Data */}
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
                  <pre className="text-xs rounded-lg p-3 overflow-auto h-48 font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
