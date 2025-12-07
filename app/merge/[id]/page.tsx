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
  ChevronLeft,
  RefreshCw,
  RotateCcw,
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
import { RulesPanel } from '@/components/rules-panel';
import { cn } from '@/lib/utils';
import type { Merge, UnifiedElement } from '@/lib/types/merge';
import type { MultiFrameworkRule } from '@/lib/types/rules';

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
  const [withProps, setWithProps] = useState(false); // Generate React components with props interface
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedClasses, setCopiedClasses] = useState(false);
  const [copiedRawData, setCopiedRawData] = useState(false);
  const [rawDataLimit, setRawDataLimit] = useState(2000);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [displayCode, setDisplayCode] = useState<string>(''); // Code for selected node
  const [displayCss, setDisplayCss] = useState<string>(''); // CSS for selected node
  const [displayAltNode, setDisplayAltNode] = useState<any>(null); // SimpleAltNode for Layout block
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [allMergeIds, setAllMergeIds] = useState<string[]>([]); // For prev/next navigation

  // Load all merge IDs for navigation
  useEffect(() => {
    async function loadMergeIds() {
      try {
        const response = await fetch('/api/merges');
        if (response.ok) {
          const data = await response.json();
          // Sort by createdAt desc (newest first) and extract IDs
          const sortedIds = (data.merges || [])
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((m: any) => m.id);
          setAllMergeIds(sortedIds);
        }
      } catch (error) {
        console.error('Failed to load merge IDs:', error);
      }
    }
    loadMergeIds();
  }, []);

  // Navigation functions
  const currentIndex = allMergeIds.indexOf(mergeId as string);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMergeIds.length - 1 && currentIndex !== -1;

  const goToPrevMerge = () => {
    if (hasPrev) {
      router.push(`/merge/${allMergeIds[currentIndex - 1]}`);
    }
  };

  const goToNextMerge = () => {
    if (hasNext) {
      router.push(`/merge/${allMergeIds[currentIndex + 1]}`);
    }
  };

  // Load rules on mount
  useEffect(() => {
    async function loadRules() {
      try {
        const response = await fetch('/api/rules');
        if (response.ok) {
          const data = await response.json();
          // Combine all 3 tiers of rules
          const allRules = [
            ...(data.officialRules || []),
            ...(data.communityRules || []),
            ...(data.customRules || []),
          ];
          setMultiFrameworkRules(allRules);
        }
      } catch (error) {
        console.error('Failed to load rules:', error);
      }
    }
    loadRules();
  }, []);

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

  // Generate code for selected node (like 1-node viewer)
  useEffect(() => {
    if (!mergeId || !selectedNode) {
      setDisplayCode('');
      setDisplayCss('');
      setDisplayAltNode(null);
      return;
    }

    // Get the source nodeId (original Figma ID)
    const sourceNodeId = selectedNode.sources?.mobile?.nodeId
      || selectedNode.sources?.tablet?.nodeId
      || selectedNode.sources?.desktop?.nodeId;

    if (!sourceNodeId) {
      setDisplayCode('// No source node ID found');
      setDisplayAltNode(null);
      return;
    }

    async function fetchCode() {
      setIsLoadingCode(true);
      try {
        const params = new URLSearchParams({ framework: previewFramework });
        if (withProps) params.set('withProps', 'true');
        const response = await fetch(
          `/api/merges/${mergeId}/node/${encodeURIComponent(sourceNodeId!)}?${params}`
        );
        if (response.ok) {
          const data = await response.json();
          setDisplayCode(data.code || '');
          setDisplayCss(data.css || '');
          setDisplayAltNode(data.altNode || null);
        } else {
          setDisplayCode('// Failed to generate code');
          setDisplayAltNode(null);
        }
      } catch (error) {
        console.error('Failed to fetch node code:', error);
        setDisplayCode('// Error generating code');
        setDisplayAltNode(null);
      } finally {
        setIsLoadingCode(false);
      }
    }

    fetchCode();
  }, [mergeId, selectedNode, previewFramework, withProps]);

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
              onClick={async () => {
                try {
                  const response = await fetch(`/api/merges/${mergeId}`, { method: 'PATCH' });
                  if (response.ok) {
                    // Reload page to get fresh data
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Regenerate failed:', error);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
              title="Regenerate merge"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
              title="Refresh preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Export">
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
            {/* Prev/Next navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMerge}
                disabled={!hasPrev}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg border border-border-primary transition-colors",
                  hasPrev
                    ? "bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary"
                    : "bg-bg-secondary/50 text-text-muted/30 cursor-not-allowed"
                )}
                title={hasPrev ? "Previous merge" : "No previous merge"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextMerge}
                disabled={!hasNext}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg border border-border-primary transition-colors",
                  hasNext
                    ? "bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary"
                    : "bg-bg-secondary/50 text-text-muted/30 cursor-not-allowed"
                )}
                title={hasNext ? "Next merge" : "No next merge"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
        <div className="grid grid-cols-2 gap-4">
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
                {/* Props checkbox - only visible for React frameworks */}
                {(previewFramework === 'react-tailwind' || previewFramework === 'react-tailwind-v4') && (
                  <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={withProps}
                      onChange={(e) => setWithProps(e.target.checked)}
                      className="h-3 w-3 rounded border-gray-600 accent-accent"
                    />
                    Props
                  </label>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    let contentToCopy: string;
                    if (codeActiveTab === 'styles') {
                      if (previewFramework === 'html-css') {
                        contentToCopy = displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '';
                      } else {
                        contentToCopy = '/* Tailwind classes are inline - no separate styles needed */';
                      }
                    } else {
                      if (previewFramework === 'html-css') {
                        contentToCopy = displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
                      } else {
                        contentToCopy = displayCode || generatedCode;
                      }
                    }
                    await navigator.clipboard.writeText(contentToCopy);
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
                    const isStylesHtmlCss = codeActiveTab === 'styles' && previewFramework === 'html-css';
                    const ext = isStylesHtmlCss ? 'css' : (previewFramework === 'html-css' ? 'html' : 'tsx');
                    let content: string;
                    if (codeActiveTab === 'styles') {
                      if (previewFramework === 'html-css') {
                        content = displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '';
                      } else {
                        content = '/* Tailwind classes are inline - no separate styles needed */';
                      }
                    } else {
                      if (previewFramework === 'html-css') {
                        content = displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
                      } else {
                        content = displayCode || generatedCode;
                      }
                    }
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedNode?.name || merge.name}.${ext}`;
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
            <div className="flex-1 min-h-0 overflow-hidden relative">
              {isLoadingCode && (
                <div className="absolute inset-0 bg-bg-primary/50 flex items-center justify-center z-10">
                  <div className="animate-spin h-5 w-5 border-2 border-accent-primary border-t-transparent rounded-full" />
                </div>
              )}
              <Highlight
                theme={codeTheme}
                code={(() => {
                  if (codeActiveTab === 'styles') {
                    if (previewFramework === 'html-css') {
                      return displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '/* No CSS */';
                    } else {
                      return '/* Tailwind classes are inline - no separate styles needed */';
                    }
                  }
                  // Component tab
                  if (previewFramework === 'html-css') {
                    return displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
                  }
                  return displayCode || generatedCode;
                })()}
                language={codeActiveTab === 'styles' ? 'css' : (previewFramework === 'html-css' ? 'markup' : 'tsx')}
              >
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre className="text-xs rounded-lg p-4 overflow-auto max-h-[490px] font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
              <span>{(() => {
                if (codeActiveTab === 'styles') {
                  if (previewFramework === 'html-css') {
                    return (displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '').split('\n').length;
                  }
                  return 1; // "Tailwind classes are inline" message
                }
                if (previewFramework === 'html-css') {
                  return (displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode).split('\n').length;
                }
                return (displayCode || generatedCode).split('\n').length;
              })()} lines</span>
            </div>
          </div>

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
