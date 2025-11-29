'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { RefetchButton } from '@/components/refetch-button';
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';

export default function ViewerPage() {

  const params = useParams();
  const router = useRouter();
  const nodeId = params.nodeId as string;

  const nodes = useNodesStore((state) => state.nodes);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const selectNode = useNodesStore((state) => state.selectNode);

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

  // Multi-framework rules state
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Framework for preview (unified for now, can be split later if needed)
  const [previewFramework, setPreviewFramework] = useState<FrameworkType>('react-tailwind');

  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'information' | 'rules'>('information');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [googleFontsUrl, setGoogleFontsUrl] = useState<string | undefined>(undefined); // WP31
  const [iframeKey, setIframeKey] = useState<number>(0); // WP33: Key for iframe refresh

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
  useEffect(() => {
    async function fetchNodeWithAltNode() {
      if (!nodeId) return;

      setIsLoadingAltNode(true);
      try {
        const response = await fetch(`/api/figma/node/${nodeId}`);
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
  }, [nodeId]);

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
        } else if (previewFramework === 'html-css') {
          const output = await generateHTMLCSS(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setGeneratedCode(output.code);
          setGoogleFontsUrl(output.googleFontsUrl); // WP31
        }
      } catch (error) {
        console.error('Code generation error:', error);
      }
    }

    generateCode();
  }, [altNode?.id, multiFrameworkRules.length, previewFramework, nodeId, rootResolvedProperties]);

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

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-primary p-4 bg-bg-card">
        <div className="mx-auto flex items-center justify-between">
          {/* Left: Breadcrumbs + Thumbnail + Name */}
          <div className="flex items-center gap-4">
            {/* Breadcrumbs with type icons */}
            <Breadcrumbs
              items={[
                { label: 'Library', href: '/nodes' },
                { label: currentNode.name, figmaType: nodeType },
              ]}
              className="mr-4"
            />

            {/* Thumbnail */}
            <div className="w-12 h-12 bg-bg-secondary rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent-primary">
              {currentNode.thumbnail ? (
                <Image
                  src={currentNode.thumbnail}
                  alt={currentNode.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-2xl">
                  📦
                </div>
              )}
            </div>

            {/* Name and metadata */}
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <FigmaTypeIcon type={nodeType} size={18} className={nodeColors.text} />
                {currentNode.name}
              </h1>
              <div className="text-sm text-text-secondary">
                {nodeType} • {new Date(currentNode.addedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Prev/Next navigation */}
            <button
              onClick={() => {
                if (prevNode) {
                  router.push(`/viewer/${prevNode.id}`);
                }
              }}
              disabled={!prevNode}
              className="p-2 rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
              title="Previous node"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                if (nextNode) {
                  router.push(`/viewer/${nextNode.id}`);
                }
              }}
              disabled={!nextNode}
              className="p-2 rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
              title="Next node"
            >
              <ChevronRight size={20} />
            </button>

            {/* Re-fetch from Figma (WP33: with SSE progress) */}
            <RefetchButton
              nodeId={nodeId}
              onRefetchComplete={async () => {
                await loadLibrary();
                const response = await fetch(`/api/figma/node/${nodeId}`);
                if (response.ok) {
                  const data = await response.json();
                  setAltNode(data.altNode || null);
                }
              }}
            />

            {/* Refresh Preview (WP33: reload iframe without refetching) */}
            <button
              onClick={() => setIframeKey(prev => prev + 1)}
              className="p-2 rounded-lg hover:bg-bg-hover text-text-primary"
              title="Refresh preview"
            >
              <RefreshCw size={20} />
            </button>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-bg-hover text-text-primary"
                  title="Export"
                >
                  <Download size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generatedCode);
                      console.log('Code copied to clipboard');
                    } catch (error) {
                      console.error('Failed to copy:', error);
                      alert('Failed to copy to clipboard');
                    }
                  }}
                >
                  Copy to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${currentNode.name}.tsx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Code File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* "Edit Rules" button */}
            <button
              onClick={() => (window.location.href = `/rules?nodeId=${nodeId}`)}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover flex items-center gap-2"
            >
              <Settings size={16} />
              Edit Rules
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mode Toolbar */}
      <div className="flex gap-2 items-center border-b border-border-primary p-2 bg-bg-card">
        {/* Toggle Responsive Mode */}
        <Button
          variant={viewerResponsiveMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewerResponsiveMode(!viewerResponsiveMode)}
        >
          <Monitor className="w-4 h-4 mr-1" />
          Responsive Mode
        </Button>

        {/* Options visible only if responsive mode active */}
        {viewerResponsiveMode && (
          <>
            {/* Toggle Grid */}
            <Button
              variant={viewerGridVisible ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewerGridVisible(!viewerGridVisible)}
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Grid
            </Button>

            {/* Grid Spacing */}
            {viewerGridVisible && (
              <Select
                value={viewerGridSpacing.toString()}
                onValueChange={(v: string) => setViewerGridSpacing(Number(v) as 8 | 16 | 24)}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="24">24px</SelectItem>
                </SelectContent>
              </Select>
            )}

          </>
        )}

        {/* WP35: Toggle Selection Highlight */}
        <Button
          variant={viewerHighlightEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewerHighlightEnabled(!viewerHighlightEnabled)}
          title={viewerHighlightEnabled ? 'Disable selection highlight' : 'Enable selection highlight'}
        >
          <Crosshair className="w-4 h-4" />
        </Button>

        {/* Framework Selector */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-text-secondary">Framework:</span>
          <Select value={previewFramework} onValueChange={(v: string) => setPreviewFramework(v as FrameworkType)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react-tailwind">React + Tailwind</SelectItem>
              <SelectItem value="html-css">HTML + CSS</SelectItem>
              <SelectItem value="react-inline">React Inline</SelectItem>
              <SelectItem value="swift-ui">SwiftUI</SelectItem>
              <SelectItem value="android-xml">Android XML</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Three-Panel Elastic Layout with Resizable */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Tree View (Collapsable & Resizable) */}
        {!viewerLeftPanelCollapsed && (
          <>
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="border-r border-border-primary bg-bg-primary relative"
            >
              <div className="h-full overflow-auto pt-10">
                <FigmaTreeView
                  altNode={altNode}
                  selectedNodeId={selectedTreeNodeId}
                  onNodeClick={(id) => setSelectedTreeNodeId(id)}
                />
              </div>

              {/* Collapse Button */}
              <button
                onClick={() => setViewerLeftPanelCollapsed(true)}
                className="absolute top-2 right-2 z-[60] p-1.5 rounded bg-bg-secondary border border-border-primary hover:bg-bg-hover shadow-lg text-text-primary"
                title="Collapse tree"
              >
                <PanelLeftClose size={14} />
              </button>
            </ResizablePanel>

            <ResizableHandle className="bg-border-primary" />
          </>
        )}

        {/* Expand Left Button (when collapsed) */}
        {viewerLeftPanelCollapsed && (
          <button
            onClick={() => setViewerLeftPanelCollapsed(false)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded bg-bg-secondary border border-border-primary hover:bg-bg-hover shadow-lg text-text-primary"
            title="Expand tree"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Center Panel - Live Preview (Elastic) */}
        <ResizablePanel className="relative bg-bg-canvas">
          <ResizablePreviewViewport>
            <LivePreview
              ref={livePreviewRef}
              key={iframeKey} // WP33: Force re-render when refresh button clicked
              code={generatedCode}
              framework={previewFramework}
              language={previewFramework === 'html-css' ? 'html' : 'tsx'}
              googleFontsUrl={googleFontsUrl}
            />
          </ResizablePreviewViewport>
        </ResizablePanel>

        {/* Expand Right Button (when collapsed) */}
        {viewerRightPanelCollapsed && (
          <button
            onClick={() => setViewerRightPanelCollapsed(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded bg-bg-secondary border border-border-primary hover:bg-bg-hover shadow-lg text-text-primary"
            title="Expand info"
          >
            <PanelRightOpen size={16} />
          </button>
        )}

        {/* Right Panel - Information/Rules Tabs (Collapsable & Resizable) */}
        {!viewerRightPanelCollapsed && (
          <>
            <ResizableHandle className="bg-border-primary" />

            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="border-l border-border-primary bg-bg-primary relative"
            >
              {/* Collapse Button */}
              <button
                onClick={() => setViewerRightPanelCollapsed(true)}
                className="absolute top-2 left-2 z-[60] p-1.5 rounded bg-bg-secondary border border-border-primary hover:bg-bg-hover shadow-lg text-text-primary"
                title="Collapse info"
              >
                <PanelRightClose size={14} />
              </button>

              <Tabs
                value={rightPanelTab}
                onValueChange={(v) => setRightPanelTab(v as 'information' | 'rules')}
                className="flex-1 flex flex-col overflow-hidden h-full pt-10"
              >
                <TabsList className="w-full justify-start border-b border-gray-700 rounded-none bg-transparent h-auto p-0">
                  <TabsTrigger
                    value="information"
                    className="text-xs text-gray-400 data-[state=active]:text-gray-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent px-3 py-2"
                  >
                    Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="rules"
                    className="text-xs text-gray-400 data-[state=active]:text-gray-200 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent px-3 py-2"
                  >
                    Rules
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="information" className="flex-1 overflow-auto m-0">
                  <InformationPanel
                    node={selectedNode}
                    framework={previewFramework}
                    onFrameworkChange={setPreviewFramework}
                    resolvedProperties={resolvedProperties}
                    allRules={multiFrameworkRules}
                    nodeId={nodeId}
                  />
                </TabsContent>

                <TabsContent value="rules" className="flex-1 overflow-auto m-0">
                  <RulesPanel
                    node={selectedNode}
                    selectedFramework={previewFramework}
                    onFrameworkChange={setPreviewFramework}
                    allRules={multiFrameworkRules}
                  />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
