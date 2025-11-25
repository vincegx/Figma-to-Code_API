'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNodesStore, useRulesStore } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import FigmaTreeView from '@/components/figma-tree-view';
import AppliedRulesInspector from '@/components/applied-rules-inspector';
import PreviewTabs from '@/components/preview-tabs';
import { FigmaPropertiesPanel } from '@/components/figma-properties-panel';
import { TechnicalRenderPanel } from '@/components/technical-render-panel';
import { FigmaTypeIcon } from '@/components/figma-type-icon';
import { getNodeColors } from '@/lib/utils/node-colors';
import type { SimpleAltNode } from '@/lib/altnode-transform';

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const nodeId = params.nodeId as string;

  const nodes = useNodesStore((state) => state.nodes);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const selectNode = useNodesStore((state) => state.selectNode);
  const rulesFromStore = useRulesStore((state) => state.rules);
  const loadRules = useRulesStore((state) => state.loadRules);

  // Convert MappingRule[] to SimpleMappingRule[] for components
  // For MVP, use empty array since full rule evaluation is complex
  const rules: import('@/lib/types/rules').SimpleMappingRule[] = [];

  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'code' | 'render'>('code');
  const [rightPanelTab, setRightPanelTab] = useState<
    'figma' | 'technical' | 'code'
  >('figma');
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

  // Load library data on mount
  useEffect(() => {
    loadLibrary();
    loadRules();
    selectNode(nodeId);
  }, [loadLibrary, loadRules, selectNode, nodeId]);

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

  // Prev/Next navigation helpers
  const currentIndex = nodes.findIndex((n) => n.id === nodeId);
  const prevNode = currentIndex > 0 ? nodes[currentIndex - 1] : null;
  const nextNode =
    currentIndex < nodes.length - 1 ? nodes[currentIndex + 1] : null;

  if (!currentNode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Node not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The node you&apos;re looking for doesn&apos;t exist or hasn&apos;t been imported
            yet.
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
                <FigmaTypeIcon
                  type={nodeType}
                  size={18}
                  className={nodeColors.text}
                />
                {currentNode.name}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {nodeType} •{' '}
                {new Date(currentNode.addedAt).toLocaleDateString()}
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
                  // POST to refresh from Figma API
                  await fetch(`/api/figma/node/${nodeId}`, {
                    method: 'POST',
                  });
                  await loadLibrary();
                  // Refresh altNode with new data
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
                      // TODO: Show success toast
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
                    const blob = new Blob([generatedCode], {
                      type: 'text/plain',
                    });
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

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'code' | 'render')}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 rounded-none bg-white dark:bg-gray-800">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="render">Render</TabsTrigger>
        </TabsList>

        {/* Code Tab */}
        <TabsContent value="code" className="flex-1 flex overflow-hidden m-0">
          <div className="flex-1 flex overflow-hidden">
            {/* Tree View (left 40%) */}
            <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 overflow-auto bg-white dark:bg-gray-800">
              <FigmaTreeView
                altNode={altNode}
                selectedNodeId={selectedTreeNodeId}
                onNodeClick={(id) => setSelectedTreeNodeId(id)}
              />
            </div>

            {/* Right Panel with Tabs (60%) */}
            <div className="w-3/5 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
              <Tabs
                value={rightPanelTab}
                onValueChange={(v) =>
                  setRightPanelTab(v as 'figma' | 'technical' | 'code')
                }
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-900 px-2">
                  <TabsTrigger value="figma" className="text-sm">
                    Figma
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="text-sm">
                    Technical
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-sm">
                    Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="figma"
                  className="flex-1 overflow-auto m-0"
                >
                  <FigmaPropertiesPanel node={selectedNode} />
                </TabsContent>

                <TabsContent
                  value="technical"
                  className="flex-1 overflow-auto m-0"
                >
                  <TechnicalRenderPanel node={selectedNode} />
                </TabsContent>

                <TabsContent value="code" className="flex-1 overflow-auto m-0">
                  <AppliedRulesInspector
                    altNode={altNode}
                    selectedNodeId={selectedTreeNodeId}
                    rules={rules}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* Render Tab */}
        <TabsContent value="render" className="flex-1 overflow-hidden m-0">
          <PreviewTabs
            altNode={altNode}
            rules={rules}
            onCodeChange={setGeneratedCode}
            scopedNode={selectedNode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
