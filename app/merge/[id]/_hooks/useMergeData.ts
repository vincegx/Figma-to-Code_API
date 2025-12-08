'use client';

/**
 * useMergeData Hook
 *
 * Handles data fetching for the Merge Viewer page.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Merge, UnifiedElement } from '@/lib/types/merge';
import type { MultiFrameworkRule } from '@/lib/types/rules';

interface UseMergeDataOptions {
  mergeId: string;
}

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

export function useMergeData({ mergeId }: UseMergeDataOptions) {
  const router = useRouter();

  const [merge, setMerge] = useState<Merge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [multiFrameworkRules, setMultiFrameworkRules] = useState<MultiFrameworkRule[]>([]);
  const [allMergeIds, setAllMergeIds] = useState<string[]>([]);

  // Load all merge IDs for navigation
  useEffect(() => {
    async function loadMergeIds() {
      try {
        const response = await fetch('/api/merges');
        if (response.ok) {
          const data = await response.json();
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

  // Navigation
  const currentIndex = allMergeIds.indexOf(mergeId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMergeIds.length - 1 && currentIndex !== -1;
  const goToPrevMerge = () => { if (hasPrev) router.push(`/merge/${allMergeIds[currentIndex - 1]}`); };
  const goToNextMerge = () => { if (hasNext) router.push(`/merge/${allMergeIds[currentIndex + 1]}`); };

  // Load rules
  useEffect(() => {
    async function loadRules() {
      try {
        const response = await fetch('/api/rules');
        if (response.ok) {
          const data = await response.json();
          setMultiFrameworkRules([
            ...(data.officialRules || []),
            ...(data.communityRules || []),
            ...(data.customRules || []),
          ]);
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
        if (!response.ok) throw new Error(`Failed to load merge: ${response.statusText}`);
        const data = await response.json();
        setMerge(data.merge);
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

  const unifiedTree = merge?.result?.unifiedTree || null;
  const googleFontsUrl = merge?.result?.googleFontsUrl;

  const breakpoints = useMemo(() => {
    if (!merge?.sourceNodes) return undefined;
    const mobileNode = merge.sourceNodes.find(n => n.breakpoint === 'mobile');
    const tabletNode = merge.sourceNodes.find(n => n.breakpoint === 'tablet');
    if (!mobileNode || !tabletNode) return undefined;
    return { mobileWidth: mobileNode.width, tabletWidth: tabletNode.width };
  }, [merge?.sourceNodes]);

  const selectedNode = useMemo(() => {
    if (!unifiedTree || !selectedNodeId) return null;
    return findNodeInTree(unifiedTree, selectedNodeId);
  }, [unifiedTree, selectedNodeId]);

  const displayNode = selectedNode || unifiedTree;

  return {
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
  };
}
