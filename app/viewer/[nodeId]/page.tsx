'use client';

import { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
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
import LivePreview from '@/components/live-preview';
import { FigmaTypeIcon } from '@/components/figma-type-icon';
import { getNodeColors } from '@/lib/utils/node-colors';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';

// Viewport presets for responsive mode
const VIEWPORT_PRESETS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  desktop: { width: 1920, height: 1080, name: 'Desktop (Full HD)' },
  custom: { width: 1200, height: 800, name: 'Custom' },
} as const;

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
    setViewerResponsiveMode,
    setViewerViewportSize,
    setViewerGridVisible,
    setViewerGridSpacing,
    setViewerLeftPanelCollapsed,
    setViewerRightPanelCollapsed,
  } = useUIStore();

  // Multi-framework rules state
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Framework for preview (unified for now, can be split later if needed)
  const [previewFramework, setPreviewFramework] = useState<FrameworkType>('react-tailwind');

  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'information' | 'rules'>('information');
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // AltNode is computed on-the-fly from node data API (Constitutional Principle III)
  const [altNode, setAltNode] = useState<SimpleAltNode | null>(null);
  const [isLoadingAltNode, setIsLoadingAltNode] = useState(false);

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

  // Evaluate rules for preview
  const resolvedProperties = useMemo(() => {
    const targetNode = selectedNode || altNode;
    if (!targetNode || multiFrameworkRules.length === 0) return {};
    return evaluateMultiFrameworkRules(targetNode, multiFrameworkRules, previewFramework).properties;
  }, [selectedNode, altNode, multiFrameworkRules, previewFramework]);

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
    loadLibrary();
    selectNode(nodeId);
  }, [loadLibrary, selectNode, nodeId]);

  // Fetch node data with AltNode transformation on-the-fly
  useEffect(() => {
    async function fetchNodeWithAltNode() {
      if (!nodeId) return;

      setIsLoadingAltNode(true);
      try {
        const response = await fetch(`/api/figma/node/${nodeId}`);
        if (response.ok) {
          const data = await response.json();
          setAltNode(data.altNode || null);
        }
      } catch (error) {
        console.error('Failed to fetch node data:', error);
      } finally {
        setIsLoadingAltNode(false);
      }
    }

    fetchNodeWithAltNode();
  }, [nodeId]);

  // Auto-select root node on first load if nothing is selected
  useEffect(() => {
    if (altNode && !selectedTreeNodeId) {
      setSelectedTreeNodeId(altNode.id);
    }
  }, [altNode, selectedTreeNodeId]);

  // Generate code whenever altNode, selectedNode, framework, or rules change
  useEffect(() => {
    async function generateCode() {
      const targetNode = selectedNode || altNode;
      if (!targetNode) {
        setGeneratedCode('');
        return;
      }

      try {
        // Import code generators dynamically
        const { generateReactTailwind } = await import('@/lib/code-generators/react-tailwind');
        const { generateHTMLCSS } = await import('@/lib/code-generators/html-css');
        const { generateReactJSX } = await import('@/lib/code-generators/react');

        let codeOutput;
        switch (previewFramework) {
          case 'react-tailwind':
            codeOutput = generateReactTailwind(targetNode, resolvedProperties);
            break;
          case 'html-css':
            codeOutput = generateHTMLCSS(targetNode, resolvedProperties);
            break;
          case 'react-inline':
            codeOutput = generateReactJSX(targetNode, resolvedProperties);
            break;
          default:
            codeOutput = generateReactTailwind(targetNode, resolvedProperties);
        }
        setGeneratedCode(codeOutput.code);
      } catch (error) {
        console.error('Failed to generate code:', error);
      }
    }

    generateCode();
  }, [altNode, selectedNode, previewFramework, multiFrameworkRules]);

  // Prev/Next navigation helpers
  const currentIndex = nodes.findIndex((n) => n.id === nodeId);
  const prevNode = currentIndex > 0 ? nodes[currentIndex - 1] : null;
  const nextNode = currentIndex < nodes.length - 1 ? nodes[currentIndex + 1] : null;

  if (!currentNode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Node not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The node you&apos;re looking for doesn&apos;t exist or hasn&apos;t been imported yet.
          </p>
          <Link
            href="/nodes"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-block"
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto flex items-center justify-between">
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
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500">
              {currentNode.thumbnail ? (
                <Image
                  src={currentNode.thumbnail}
                  alt={currentNode.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  📦
                </div>
              )}
            </div>

            {/* Name and metadata */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FigmaTypeIcon type={nodeType} size={18} className={nodeColors.text} />
                {currentNode.name}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next node"
            >
              <ChevronRight size={20} />
            </button>

            {/* Re-fetch */}
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/figma/node/${nodeId}`, { method: 'POST' });
                  await loadLibrary();
                  const response = await fetch(`/api/figma/node/${nodeId}`);
                  if (response.ok) {
                    const data = await response.json();
                    setAltNode(data.altNode || null);
                  }
                } catch (error) {
                  console.error('Failed to re-fetch node:', error);
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Re-fetch from Figma"
            >
              <RefreshCw size={20} />
            </button>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Settings size={16} />
              Edit Rules
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mode Toolbar */}
      <div className="flex gap-2 items-center border-b border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
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

            {/* Viewport Presets */}
            <Select
              value="custom"
              onValueChange={(preset: string) => {
                if (preset in VIEWPORT_PRESETS) {
                  const { width, height } = VIEWPORT_PRESETS[preset as keyof typeof VIEWPORT_PRESETS];
                  setViewerViewportSize(width, height);
                }
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">📱 Mobile</SelectItem>
                <SelectItem value="tablet">📱 Tablet</SelectItem>
                <SelectItem value="desktop">🖥️ Desktop</SelectItem>
                <SelectItem value="custom">⚙️ Custom</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {/* Framework Selector */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Framework:</span>
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
              className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative"
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
                className="absolute top-2 right-2 z-[60] p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-lg"
                title="Collapse tree"
              >
                <PanelLeftClose size={14} />
              </button>
            </ResizablePanel>

            <ResizableHandle className="bg-gray-200 dark:bg-gray-700" />
          </>
        )}

        {/* Expand Left Button (when collapsed) */}
        {viewerLeftPanelCollapsed && (
          <button
            onClick={() => setViewerLeftPanelCollapsed(false)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-lg"
            title="Expand tree"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Center Panel - Live Preview (Elastic) */}
        <ResizablePanel className="relative bg-slate-50 dark:bg-slate-900">
          <ResizablePreviewViewport>
            <LivePreview
              code={generatedCode}
              framework={previewFramework}
              language={previewFramework === 'html-css' ? 'html' : 'tsx'}
            />
          </ResizablePreviewViewport>
        </ResizablePanel>

        {/* Expand Right Button (when collapsed) */}
        {viewerRightPanelCollapsed && (
          <button
            onClick={() => setViewerRightPanelCollapsed(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-lg"
            title="Expand info"
          >
            <PanelRightOpen size={16} />
          </button>
        )}

        {/* Right Panel - Information/Rules Tabs (Collapsable & Resizable) */}
        {!viewerRightPanelCollapsed && (
          <>
            <ResizableHandle className="bg-gray-200 dark:bg-gray-700" />

            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={30}
              className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative"
            >
              {/* Collapse Button */}
              <button
                onClick={() => setViewerRightPanelCollapsed(true)}
                className="absolute top-2 left-2 z-[60] p-1.5 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-lg"
                title="Collapse info"
              >
                <PanelRightClose size={14} />
              </button>

              <Tabs
                value={rightPanelTab}
                onValueChange={(v) => setRightPanelTab(v as 'information' | 'rules')}
                className="flex-1 flex flex-col overflow-hidden h-full pt-10"
              >
                <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-900 px-2">
                  <TabsTrigger value="information" className="text-sm">
                    Information
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="text-sm">
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
