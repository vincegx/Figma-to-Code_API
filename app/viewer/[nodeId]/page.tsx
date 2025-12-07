'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Resizable } from 're-resizable';
import { useNodesStore, useUIStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Settings,
  Monitor,
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Crosshair,
  CloudDownload,
  Clock,
  Home,
  Eye,
  Smartphone,
  Tablet,
  Copy,
  Check,
  Maximize2,
  X,
  Package,
} from 'lucide-react';
import { useApiQuota } from '@/hooks/use-api-quota';
import { QuotaIndicator } from '@/components/quota/quota-indicator';
import { Highlight, themes } from 'prism-react-renderer';
import { RefetchButton } from '@/components/refetch-button';
import { RefetchDialog } from '@/components/refetch-dialog';
import { VersionDropdown } from '@/components/version-dropdown';
import { useRefetch } from '@/hooks/use-refetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import FigmaTreeView from '@/components/figma-tree-view';
import { InformationPanel } from '@/components/information-panel';
import { RulesPanel } from '@/components/rules-panel';
import { ResizablePreviewViewport } from '@/components/resizable-preview-viewport';
import LivePreview, { type LivePreviewHandle } from '@/components/live-preview';
import { FigmaTypeIcon } from '@/components/figma-type-icon';
import { getNodeColors } from '@/lib/utils/node-colors';
import { cn } from '@/lib/utils';
// ResizablePanelGroup removed - using re-resizable uniformly
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateReactTailwindV4 } from '@/lib/code-generators/react-tailwind-v4';
import { generateHTMLTailwindCSS } from '@/lib/code-generators/html-tailwind-css';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';

// Hierarchy Block Component - local state, doesn't affect Figma Tree
function HierarchyBlock({ node }: { node: SimpleAltNode | null }) {
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

  const renderNode = (child: SimpleAltNode, depth: number = 0) => {
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
          {hasChildren && (
            <span className="text-text-muted ml-auto">{child.children!.length}</span>
          )}
        </div>
        {isExpanded && child.children && (
          <div>
            {child.children.slice(0, 10).map(subChild => renderNode(subChild, depth + 1))}
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
        {children.slice(0, 10).map(child => renderNode(child))}
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

export default function ViewerPage() {

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nodeId = params.nodeId as string;
  const startFullscreen = searchParams.get('fullscreen') === 'true';

  const nodes = useNodesStore((state) => state.nodes);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const selectNode = useNodesStore((state) => state.selectNode);

  // API Quota for header badge
  const { criticalPercent, status: apiStatus } = useApiQuota();

  // UI Store for panel collapse and responsive mode
  const {
    viewerResponsiveMode,
    viewerViewportWidth,
    viewerViewportHeight,
    viewerGridVisible,
    viewerGridSpacing,
    viewerLeftPanelCollapsed,
    viewerRightPanelCollapsed,
    viewerHighlightEnabled,
    setViewerResponsiveMode,
    setViewerViewportSize,
    setViewerGridVisible,
    setViewerGridSpacing,
    setViewerLeftPanelCollapsed,
    setViewerRightPanelCollapsed,
    setViewerHighlightEnabled,
  } = useUIStore();

  // WP35: Ref for LivePreview to send highlight messages
  const livePreviewRef = useRef<LivePreviewHandle>(null);

  // WP38 Fix #27: Theme-aware code highlighting (using Zustand store)
  const currentTheme = useUIStore((state) => state.theme);
  const codeTheme = currentTheme === 'light' ? themes.github : themes.nightOwl;

  // Multi-framework rules state
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Framework for preview (loads from Settings defaultFramework)
  const [previewFramework, setPreviewFramework] = useState<FrameworkType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const settings = localStorage.getItem('app-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          // Settings uses 'react-jsx' but viewer uses FrameworkType which doesn't include it
          // Map 'react-jsx' to 'react-tailwind' as fallback
          const framework = parsed.defaultFramework;
          if (framework === 'react-tailwind' || framework === 'react-tailwind-v4' || framework === 'html-css') {
            return framework as FrameworkType;
          }
        }
      } catch { /* ignore parse errors */ }
    }
    return 'react-tailwind';
  });

  // Language for export (loads from Settings defaultLanguage)
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
      } catch { /* ignore parse errors */ }
    }
    return 'typescript';
  });

  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'information' | 'rules'>('information');
  const [generatedCode, setGeneratedCode] = useState<string>(''); // WP42: Code for LivePreview (always root node)
  const [displayCode, setDisplayCode] = useState<string>(''); // WP42: Code for Generated Code block (selected node)
  const [displayCss, setDisplayCss] = useState<string>(''); // WP42: CSS for Styles tab (selected node)
  const [codeActiveTab, setCodeActiveTab] = useState<'component' | 'styles'>('component'); // WP42: Active tab state
  const [copiedCode, setCopiedCode] = useState(false); // WP42: Copy feedback
  const [copiedClasses, setCopiedClasses] = useState(false); // Copy feedback for Tailwind classes
  const [copiedRawData, setCopiedRawData] = useState(false); // WP42: Copy feedback for Raw Data
  const [rawDataLimit, setRawDataLimit] = useState(2000); // WP38: Expandable raw data limit
  const [googleFontsUrl, setGoogleFontsUrl] = useState<string | undefined>(undefined); // WP31
  const [iframeKey, setIframeKey] = useState<number>(0); // WP33: Key for iframe refresh
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(startFullscreen); // WP42/WP45: Fullscreen mode for Canvas Preview (supports ?fullscreen=true URL param)
  const [withProps, setWithProps] = useState(false); // WP47: Generate React components with props interface

  // WP40: Refetch dialog and version state
  const [refetchDialogOpen, setRefetchDialogOpen] = useState(false);
  const [selectedVersionFolder, setSelectedVersionFolder] = useState<string | null>(null);
  const {
    refetch,
    isRefetching,
    progress,
    result: refetchResult,
    error: refetchError,
    reset: resetRefetch,
  } = useRefetch(nodeId);

  // AltNode is computed on-the-fly from node data API (Constitutional Principle III)
  const [altNode, setAltNode] = useState<SimpleAltNode | null>(null);
  const [isLoadingAltNode, setIsLoadingAltNode] = useState(false);

  // Track if library is loaded (to avoid showing "Node not found" during initial load)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  // Find current node
  const currentNode = nodes.find((n) => n.id === nodeId);

  // Find selected node in tree
  const selectedNode = useMemo(() => {
    if (!altNode || !selectedTreeNodeId) return null;

    function findNode(node: SimpleAltNode): SimpleAltNode | null {
      if (node.id === selectedTreeNodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    }

    return findNode(altNode);
  }, [altNode, selectedTreeNodeId]);

  // Evaluate rules for selected node (used in sidebar panels)
  const resolvedProperties = useMemo(() => {
    const targetNode = selectedNode || altNode;
    if (!targetNode || multiFrameworkRules.length === 0) return {};
    return evaluateMultiFrameworkRules(targetNode, multiFrameworkRules, previewFramework).properties;
  }, [selectedNode, altNode, multiFrameworkRules, previewFramework]);

  // Evaluate rules for root node (used in code generation - always show full component)
  const rootResolvedProperties = useMemo(() => {
    if (!altNode || multiFrameworkRules.length === 0) return {};
    return evaluateMultiFrameworkRules(altNode, multiFrameworkRules, previewFramework).properties;
  }, [altNode, multiFrameworkRules, previewFramework]);

  // Display node (selected or root) - must be before early returns
  const displayNode = selectedNode || altNode;

  // Reset raw data limit when selected node changes
  useEffect(() => {
    setRawDataLimit(2000);
  }, [selectedTreeNodeId]);

  // Helper: count applied rules - must be before early returns
  const appliedRulesCount = useMemo(() => {
    if (!displayNode || multiFrameworkRules.length === 0) return 0;
    return multiFrameworkRules.filter((rule) => {
      if (!rule.transformers[previewFramework]) return false;
      // Cast selector to access optional nodeTypes field from API
      const selector = rule.selector as typeof rule.selector & { nodeTypes?: string[] };
      const nodeTypes = selector.nodeTypes || [];
      return nodeTypes.length === 0 || nodeTypes.includes(displayNode.type || '');
    }).length;
  }, [displayNode, multiFrameworkRules, previewFramework]);

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

  // Load multi-framework rules from API (WP20: 3-tier system)
  useEffect(() => {
    async function loadMultiFrameworkRules() {
      try {
        const response = await fetch('/api/rules');

        if (!response.ok) {
          throw new Error(`Failed to load rules: ${response.statusText}`);
        }

        const data = await response.json();
        const rules: MultiFrameworkRule[] = [
          ...(data.officialRules || []),
          ...(data.communityRules || []),
          ...(data.customRules || [])
        ];

        setMultiFrameworkRules(rules);
      } catch (error) {
        console.error('Failed to load multi-framework rules:', error);
      } finally {
        setIsLoadingRules(false);
      }
    }

    loadMultiFrameworkRules();
  }, []);

  // Load library data on mount
  useEffect(() => {
    async function load() {
      await loadLibrary();
      setIsLibraryLoaded(true);
    }
    load();
    selectNode(nodeId);
  }, [loadLibrary, selectNode, nodeId]);

  // Fetch node data with AltNode transformation on-the-fly
  // WP32 PERF: Set altNode AND selectedTreeNodeId together to avoid cascade
  // WP42: Added iframeKey dependency to re-fetch after refetch completes
  useEffect(() => {
    async function fetchNodeWithAltNode() {
      if (!nodeId) return;

      setIsLoadingAltNode(true);
      try {
        // Add cache-buster to force fresh data after refetch
        const response = await fetch(`/api/figma/node/${nodeId}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          const node = data.altNode || null;
          setAltNode(node);
          if (node) setSelectedTreeNodeId(node.id);

          // WP31: Cache variables for CSS variable generation
          if (data.variables && Object.keys(data.variables).length > 0) {
            setCachedVariablesMap({
              variables: data.variables,
              lastUpdated: new Date().toISOString(),
              version: 1
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch node data:', error);
      } finally {
        setIsLoadingAltNode(false);
      }
    }

    fetchNodeWithAltNode();
  }, [nodeId, iframeKey]);

  // Generate code directly in ViewerPage (independent of right panel visibility)
  // WP35: Always use altNode (root) for code generation - selection only affects highlight
  useEffect(() => {
    if (!altNode || multiFrameworkRules.length === 0) {
      return;
    }

    // Capture non-null altNode for closure
    const rootNode = altNode;

    async function generateCode() {
      try {
        if (previewFramework === 'react-tailwind') {
          const output = await generateReactTailwind(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setGeneratedCode(output.code);
          setGoogleFontsUrl(output.googleFontsUrl); // WP31
        } else if (previewFramework === 'react-tailwind-v4') {
          const output = await generateReactTailwindV4(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setGeneratedCode(output.code);
          setGoogleFontsUrl(output.googleFontsUrl); // WP31
        } else if (previewFramework === 'html-css') {
          const output = await generateHTMLTailwindCSS(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          // WP42: Combine HTML + CSS with marker for LivePreview (buildHTMLDocument splits on /* CSS */)
          const combinedCode = `<!-- HTML -->\n${output.code}\n\n/* CSS */\n${output.css || ''}`;
          setGeneratedCode(combinedCode);
          setGoogleFontsUrl(output.googleFontsUrl); // WP31
        }
      } catch (error) {
        console.error('Code generation error:', error);
      }
    }

    generateCode();
  }, [altNode?.id, multiFrameworkRules.length, previewFramework, nodeId, rootResolvedProperties, iframeKey]);

  // WP42: Generate code for selected node (or root if none selected) - for Generated Code block
  useEffect(() => {
    const targetNode = selectedNode || altNode;
    if (!targetNode || multiFrameworkRules.length === 0) {
      setDisplayCode('');
      setDisplayCss('');
      return;
    }

    async function generateDisplayCode() {
      try {
        // Evaluate rules for the target node (selected or root)
        const targetProps = evaluateMultiFrameworkRules(targetNode!, multiFrameworkRules, previewFramework).properties;

        if (previewFramework === 'react-tailwind') {
          // WP47: Pass withProps option for React frameworks
          const output = await generateReactTailwind(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId, { withProps });
          setDisplayCode(output.code);
          setDisplayCss('/* Tailwind classes are inline - no separate styles needed */');
        } else if (previewFramework === 'react-tailwind-v4') {
          // WP47: Pass withProps option for React frameworks
          const output = await generateReactTailwindV4(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId, { withProps });
          setDisplayCode(output.code);
          setDisplayCss('/* Tailwind v4 classes are inline - no separate styles needed */');
        } else if (previewFramework === 'html-css') {
          const output = await generateHTMLTailwindCSS(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          // For display, show only HTML in Component tab (CSS in Styles tab)
          setDisplayCode(output.code);
          setDisplayCss(output.css || '/* No styles generated */');
        }
      } catch (error) {
        console.error('Display code generation error:', error);
      }
    }

    generateDisplayCode();
  }, [selectedNode, altNode, multiFrameworkRules, previewFramework, nodeId, withProps]);

  // WP35: Send highlight message to iframe when selection changes
  useEffect(() => {
    if (!livePreviewRef.current) return;

    const isInstance = selectedNode?.type === 'INSTANCE' || selectedNode?.originalType === 'INSTANCE';

    livePreviewRef.current.sendHighlight(
      selectedTreeNodeId,
      selectedNode?.name || '',
      isInstance,
      viewerHighlightEnabled
    );
  }, [selectedTreeNodeId, selectedNode?.name, selectedNode?.type, selectedNode?.originalType, viewerHighlightEnabled]);

  // WP40: Handle version selection
  const handleVersionSelect = async (folder: string | null) => {
    setSelectedVersionFolder(folder);

    if (folder === null) {
      // Load current version
      const response = await fetch(`/api/figma/node/${nodeId}`);
      if (response.ok) {
        const data = await response.json();
        setAltNode(data.altNode || null);
        if (data.altNode) setSelectedTreeNodeId(data.altNode.id);
      }
    } else {
      // Load historical version
      const response = await fetch(`/api/figma/node/${encodeURIComponent(nodeId)}/version/${encodeURIComponent(folder)}`);
      if (response.ok) {
        const data = await response.json();
        setAltNode(data.altNode || null);
        if (data.altNode) setSelectedTreeNodeId(data.altNode.id);
      }
    }
  };

  // WP40: Handle refetch complete - reload current node data
  // Called when dialog closes after successful update (not for up_to_date)
  // WP42: Simplified - iframeKey change triggers useEffect to re-fetch data
  const handleRefetchComplete = async () => {
    setSelectedVersionFolder(null); // Reset to current version
    await loadLibrary();
    // Increment iframeKey to trigger data re-fetch and preview refresh
    setIframeKey(prev => prev + 1);
  };

  // Prev/Next navigation helpers
  const currentIndex = nodes.findIndex((n) => n.id === nodeId);
  const prevNode = currentIndex > 0 ? nodes[currentIndex - 1] : null;
  const nextNode = currentIndex < nodes.length - 1 ? nodes[currentIndex + 1] : null;

  // Show loading state while library is being fetched
  if (!isLibraryLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-text-secondary">Loading...</span>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="container mx-auto px-4 py-8 bg-bg-primary min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">Node not found</h1>
          <p className="text-text-secondary mb-4">
            The node you&apos;re looking for doesn&apos;t exist or hasn&apos;t been imported yet.
          </p>
          <Link
            href="/nodes"
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover inline-block"
          >
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  // Get node type colors for breadcrumb
  const nodeType = currentNode.altNode?.type || 'FRAME';
  const nodeColors = getNodeColors(nodeType);

  // Helper: format date
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper: count children
  const countChildren = (node: SimpleAltNode | null): number => {
    if (!node?.children) return 0;
    return node.children.length;
  };

  // Helper: get hierarchy nodes
  const getHierarchyNodes = (node: SimpleAltNode | null): { name: string; id: string }[] => {
    if (!node?.children) return [];
    return node.children.slice(0, 5).map((child) => ({ name: child.name || 'unnamed', id: child.id }));
  };

  const codeLines = generatedCode.split('\n').length;

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* ========== HEADER ========== */}
      <header className="flex-shrink-0 flex justify-between px-5 py-3">
        {/* BLOC GAUCHE: Titre + Date + Breadcrumb */}
        <div>
          <div className="flex items-center gap-4 mb-1">
            <h1 className="text-2xl font-semibold text-text-primary">{currentNode.name}</h1>
            <VersionDropdown
              nodeId={nodeId}
              selectedVersion={selectedVersionFolder}
              onVersionSelect={handleVersionSelect}
              refreshKey={iframeKey}
            />
            {selectedVersionFolder && (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded">
                Ancienne version
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-text-muted hover:text-text-primary"><Home className="w-4 h-4" /></Link>
            <ChevronRight className="w-4 h-4 text-text-muted" />
            <Link href="/nodes" className="text-text-muted hover:text-text-primary">Code render</Link>
            <ChevronRight className="w-4 h-4 text-text-muted" />
            <span className="text-text-primary">{displayNode?.name || currentNode.name}</span>
          </div>
        </div>

        {/* BLOC DROIT: API Badge + Actions */}
        <div className="flex items-center gap-4">
          {/* API Badge avec Popover */}
          <QuotaIndicator />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefetchDialogOpen(true)}
              disabled={isRefetching}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
              title="Re-fetch from Figma"
            >
              <CloudDownload className="w-4 h-4" />
            </button>
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
                  const ext = previewFramework === 'html-css' ? 'html' : (exportLanguage === 'typescript' ? 'tsx' : 'jsx');
                  const blob = new Blob([generatedCode], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentNode.name}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Code File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  const params = new URLSearchParams({
                    framework: previewFramework,
                    language: exportLanguage,
                  });
                  try {
                    const response = await fetch(`/api/export/${nodeId}?${params}`);
                    if (!response.ok) {
                      console.error('Export failed:', await response.text());
                      return;
                    }
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${currentNode?.name || 'export'}-export.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Export error:', error);
                  }
                }}>
                  <Package className="h-4 w-4 mr-2" />
                  Download ZIP Package
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => prevNode && router.push(`/viewer/${prevNode.id}`)}
              disabled={!prevNode}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              title="Previous node"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextNode && router.push(`/viewer/${nextNode.id}`)}
              disabled={!nextNode}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
              title="Next node"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Select value={previewFramework} onValueChange={(v) => setPreviewFramework(v as FrameworkType)}>
              <SelectTrigger className="h-8 w-[160px] bg-bg-secondary border-border-primary text-xs text-text-muted hover:bg-bg-hover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-card border border-border-primary">
                <SelectItem value="react-tailwind" className="text-xs">React + Tailwind</SelectItem>
                <SelectItem value="react-tailwind-v4" className="text-xs">React + Tailwind v4</SelectItem>
                <SelectItem value="html-css" className="text-xs">HTML + CSS</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => router.push(`/rules?nodeId=${nodeId}`)}
              className="h-8 px-4 flex items-center gap-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-sm font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit Rules
            </button>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT (scrollable) ========== */}
      <main className="flex-1 overflow-auto p-4">

        {/* ========== ROW 1: Figma Tree + Canvas Preview (resizable height) ========== */}
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
            {/* Block: Figma Tree (resizable width) */}
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
                {/* Card avec marge droite pour laisser place au handle */}
                <div className="h-full mr-5 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">Figma Tree</span>
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
                    <FigmaTreeView
                      altNode={altNode}
                      selectedNodeId={selectedTreeNodeId}
                      onNodeClick={(id) => setSelectedTreeNodeId(id)}
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

            {/* Block: Canvas Preview (takes remaining space) */}
            <div className="flex-1 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
                  <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
                  {/* Device icons for responsive mode */}
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
                    title={viewerResponsiveMode ? "Exit responsive mode" : "Enter responsive mode (resize preview)"}
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
                    googleFontsUrl={googleFontsUrl}
                  />
                </ResizablePreviewViewport>
              </div>
            </div>
          </div>
        </Resizable>

        {/* ========== ROW 2 & 3: Info panels ========== */}
        <div className="grid grid-cols-2 gap-4 items-stretch">
          {/* Block: Generated Code */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
            {/* Header */}
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
                {/* WP47: Props checkbox - only visible for React frameworks */}
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
                    const textToCopy = codeActiveTab === 'component' ? displayCode : displayCss;
                    await navigator.clipboard.writeText(textToCopy);
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
                    const textToDownload = codeActiveTab === 'component' ? displayCode : displayCss;
                    const extension = codeActiveTab === 'component'
                      ? (previewFramework === 'html-css' ? 'html' : 'tsx')
                      : 'css';
                    const blob = new Blob([textToDownload], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${displayNode?.name || currentNode.name}.${extension}`;
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
            {/* Code area - limited height to match right column */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Highlight
                theme={codeTheme}
                code={codeActiveTab === 'component' ? displayCode : displayCss}
                language={codeActiveTab === 'styles' ? 'css' : (previewFramework === 'html-css' ? 'markup' : 'tsx')}
              >
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre className="text-xs rounded-lg p-4 overflow-auto max-h-[510px] font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
            {/* Footer - always at bottom */}
            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>No errors</span>
              <span>•</span>
              <span>{(codeActiveTab === 'component' ? displayCode : displayCss).split('\n').length} lines</span>
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
                <div><span className="text-text-muted text-xs block mb-1">ID</span><span className="text-text-primary text-sm font-mono">{displayNode?.id}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Children</span><span className="text-text-primary text-sm">{countChildren(displayNode)} nodes</span></div>
                <div className="col-span-2">
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
                <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Status</span><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-400 text-sm">Visible</span><span className="text-text-muted text-sm">• Not Locked</span></span></div>
              </div>
            </div>

            {/* Hierarchy + Layout side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hierarchy */}
              <HierarchyBlock node={displayNode} />


              {/* Layout */}
              <div className="bg-bg-card rounded-xl border border-border-primary p-4">
                <span className="text-sm font-medium text-text-primary mb-4 block">Layout</span>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div><span className="text-text-muted text-xs block mb-1">Width</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.width || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Height</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.height || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">X</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.x || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Y</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.y || 0)}px</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Mode</span><span className="text-text-primary text-sm">{((displayNode?.originalNode as any)?.layoutMode || 'NONE').charAt(0) + ((displayNode?.originalNode as any)?.layoutMode || 'NONE').slice(1).toLowerCase()}</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Gap</span><span className="text-text-primary text-sm">{(displayNode?.originalNode as any)?.itemSpacing || 0}px</span></div>
                  <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Padding</span><span className="text-text-primary text-sm font-mono tracking-wider">{(displayNode?.originalNode as any)?.paddingTop || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingRight || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingBottom || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingLeft || 0}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ROW 3: Appearance/Constraints + Raw Data + Rules ========== */}
        <div className="grid grid-cols-3 gap-4 mt-4 pb-6 items-stretch">
          {/* Column 1: Appearance + Constraints */}
          <div className="flex flex-col gap-4">
            {/* Appearance */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Appearance</span>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-x-8">
                  <div><span className="text-text-muted text-xs block mb-1">Fills</span><span className="text-text-primary text-sm">{(displayNode?.originalNode as any)?.fills?.length || 0} fill(s)</span></div>
                  <div><span className="text-text-muted text-xs block mb-1">Blend Mode</span><span className="text-text-primary text-sm">{((displayNode?.originalNode as any)?.blendMode || 'PASS_THROUGH').split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}</span></div>
                </div>
                <div><span className="text-text-muted text-xs block mb-1">Opacity</span><span className="text-text-primary text-sm">{Math.round(((displayNode?.originalNode as any)?.opacity ?? 1) * 100)}%</span></div>
              </div>
            </div>

            {/* Constraints */}
            <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex-1">
              <span className="text-sm font-medium text-text-primary mb-4 block">Constraints</span>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div><span className="text-text-muted text-xs block mb-1">Horizontal</span><span className="text-text-primary text-sm">{(displayNode?.originalNode?.constraints?.horizontal || 'LEFT').charAt(0) + (displayNode?.originalNode?.constraints?.horizontal || 'LEFT').slice(1).toLowerCase()}</span></div>
                <div><span className="text-text-muted text-xs block mb-1">Vertical</span><span className="text-text-primary text-sm">{(displayNode?.originalNode?.constraints?.vertical || 'TOP').charAt(0) + (displayNode?.originalNode?.constraints?.vertical || 'TOP').slice(1).toLowerCase()}</span></div>
                <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Clipping</span><span className="flex items-center gap-1 text-sm">{(displayNode?.originalNode as any)?.clipsContent ? (<><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-400">Yes</span></>) : (<><span className="w-2 h-2 rounded-full bg-text-muted" /><span className="text-text-muted">No</span></>)}</span></div>
              </div>
            </div>
          </div>

          {/* Column 2: Raw Figma Data */}
          <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-sm font-medium text-text-primary">Raw figma data</span>
              <div className="flex items-center gap-1">
                <button onClick={async () => { await navigator.clipboard.writeText(JSON.stringify(displayNode, null, 2) || '{}'); setCopiedRawData(true); setTimeout(() => setCopiedRawData(false), 2000); }} className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover" title="Copy to clipboard">{copiedRawData ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                <button onClick={() => {
                  const jsonData = JSON.stringify(displayNode, null, 2) || '{}';
                  const blob = new Blob([jsonData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${displayNode?.name || 'figma-data'}.json`;
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
                  // Couper sur une fin de ligne pour éviter de couper au milieu d'un path SVG
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
              node={selectedNode}
              selectedFramework={previewFramework}
              allRules={multiFrameworkRules}
            />
          </div>
        </div>
      </main>

      {/* ========== DIALOGS ========== */}
      <RefetchDialog
        open={refetchDialogOpen}
        onOpenChange={async (open) => {
          setRefetchDialogOpen(open);
          // WP40: When dialog closes after successful refetch, reload data
          // Refresh for any status that indicates data was fetched (not just 'updated')
          if (!open && refetchResult && refetchResult.status !== 'up_to_date' && refetchResult.status !== 'error') {
            await handleRefetchComplete();
          }
        }}
        nodeId={nodeId}
        nodeName={currentNode.name}
        lastSyncDate={currentNode.lastModified}
        onRefetch={async () => {
          await refetch();
          // Don't close dialog automatically - let user see the result first
        }}
        isRefetching={isRefetching}
        progress={progress}
        result={refetchResult}
        error={refetchError}
        onReset={resetRefetch}
      />

      {/* ========== FULLSCREEN CANVAS PREVIEW ========== */}
      {isCanvasFullscreen && (
        <div className="fixed inset-0 z-50 bg-bg-primary flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-bg-card">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-primary">Canvas Preview</span>
              <span className="text-xs text-text-muted tabular-nums">{viewerViewportWidth} × {viewerViewportHeight}</span>
              {/* Device icons for responsive mode */}
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
                title={viewerResponsiveMode ? "Exit responsive mode" : "Enter responsive mode (resize preview)"}
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
          {/* Fullscreen Content */}
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
                googleFontsUrl={googleFontsUrl}
              />
            </ResizablePreviewViewport>
          </div>
        </div>
      )}
    </div>
  );
}
