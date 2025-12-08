'use client';

/**
 * useViewerData Hook
 *
 * Handles data fetching and state for the Viewer page:
 * - Multi-framework rules loading
 * - Node data fetching with AltNode transformation
 * - Library loading
 * - Version selection
 * - Refetch functionality
 *
 * VERBATIM from viewer/[nodeId]/page.tsx - Phase 3 refactoring
 */

import { useEffect, useState, useMemo } from 'react';
import { useNodesStore } from '@/lib/store';
import { useRefetch } from '@/hooks/use-refetch';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';

interface UseViewerDataOptions {
  nodeId: string;
  previewFramework: FrameworkType;
  iframeKey: number;
  onIframeKeyChange: () => void;
}

export function useViewerData({
  nodeId,
  previewFramework,
  iframeKey,
  onIframeKeyChange,
}: UseViewerDataOptions) {
  const nodes = useNodesStore((state) => state.nodes);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const selectNode = useNodesStore((state) => state.selectNode);

  // Multi-framework rules state
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // AltNode is computed on-the-fly from node data API (Constitutional Principle III)
  const [altNode, setAltNode] = useState<SimpleAltNode | null>(null);
  const [isLoadingAltNode, setIsLoadingAltNode] = useState(false);

  // Track if library is loaded (to avoid showing "Node not found" during initial load)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  // Tree selection
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);

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

  // Find current node
  const currentNode = nodes.find((n) => n.id === nodeId);

  // Prev/Next navigation helpers
  const currentIndex = nodes.findIndex((n) => n.id === nodeId);
  const prevNode = currentIndex > 0 ? nodes[currentIndex - 1] : null;
  const nextNode = currentIndex < nodes.length - 1 ? nodes[currentIndex + 1] : null;

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

  // Display node (selected or root)
  const displayNode = selectedNode || altNode;

  // Helper: count applied rules
  const appliedRulesCount = useMemo(() => {
    if (!displayNode || multiFrameworkRules.length === 0) return 0;
    return multiFrameworkRules.filter((rule) => {
      if (!rule.transformers[previewFramework]) return false;
      const selector = rule.selector as typeof rule.selector & { nodeTypes?: string[] };
      const nodeTypes = selector.nodeTypes || [];
      return nodeTypes.length === 0 || nodeTypes.includes(displayNode.type || '');
    }).length;
  }, [displayNode, multiFrameworkRules, previewFramework]);

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

  // WP40: Handle version selection
  // IMPORTANT: Set selectedVersionFolder AFTER fetch completes to avoid race conditions
  const handleVersionSelect = async (folder: string | null) => {
    setIsLoadingAltNode(true);

    try {
      if (folder === null) {
        // Load current version
        const response = await fetch(`/api/figma/node/${nodeId}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          // Set all state together AFTER fetch completes
          setAltNode(data.altNode || null);
          if (data.altNode) setSelectedTreeNodeId(data.altNode.id);
          setSelectedVersionFolder(null);

          // WP31: Cache variables for CSS variable generation
          if (data.variables && Object.keys(data.variables).length > 0) {
            setCachedVariablesMap({
              variables: data.variables,
              lastUpdated: new Date().toISOString(),
              version: 1
            });
          }
        }
      } else {
        // Load historical version
        const response = await fetch(`/api/figma/node/${encodeURIComponent(nodeId)}/version/${encodeURIComponent(folder)}?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          // Set all state together AFTER fetch completes
          setAltNode(data.altNode || null);
          if (data.altNode) setSelectedTreeNodeId(data.altNode.id);
          setSelectedVersionFolder(folder);

          // WP31: Cache variables for CSS variable generation
          if (data.variables && Object.keys(data.variables).length > 0) {
            setCachedVariablesMap({
              variables: data.variables,
              lastUpdated: new Date().toISOString(),
              version: 1
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load version:', error);
    } finally {
      setIsLoadingAltNode(false);
    }
  };

  // WP40: Handle refetch complete - reload current node data
  const handleRefetchComplete = async () => {
    setSelectedVersionFolder(null);
    await loadLibrary();

    // Explicitly re-fetch altNode data (don't rely on useEffect timing)
    try {
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
      console.error('Failed to reload node data after refetch:', error);
    }

    // Trigger iframe refresh for code regeneration
    onIframeKeyChange();
  };

  return {
    // Store data
    nodes,
    currentNode,
    prevNode,
    nextNode,

    // Rules
    multiFrameworkRules,
    isLoadingRules,

    // AltNode
    altNode,
    isLoadingAltNode,
    isLibraryLoaded,

    // Selection
    selectedTreeNodeId,
    setSelectedTreeNodeId,
    selectedNode,
    displayNode,

    // Computed
    resolvedProperties,
    rootResolvedProperties,
    appliedRulesCount,

    // Refetch
    refetchDialogOpen,
    setRefetchDialogOpen,
    refetch,
    isRefetching,
    progress,
    refetchResult,
    refetchError,
    resetRefetch,
    handleRefetchComplete,

    // Version
    selectedVersionFolder,
    handleVersionSelect,
  };
}
