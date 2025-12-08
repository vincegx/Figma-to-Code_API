'use client';

/**
 * useMergeCode Hook
 *
 * Handles code generation for selected node in the Merge Viewer.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useEffect, useState } from 'react';
import type { UnifiedElement } from '@/lib/types/merge';

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

interface UseMergeCodeOptions {
  mergeId: string;
  selectedNode: UnifiedElement | null;
  previewFramework: MergeFrameworkType;
  withProps: boolean;
}

export function useMergeCode({
  mergeId,
  selectedNode,
  previewFramework,
  withProps,
}: UseMergeCodeOptions) {
  const [displayCode, setDisplayCode] = useState<string>('');
  const [displayCss, setDisplayCss] = useState<string>('');
  const [displayAltNode, setDisplayAltNode] = useState<any>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  useEffect(() => {
    if (!mergeId || !selectedNode) {
      setDisplayCode('');
      setDisplayCss('');
      setDisplayAltNode(null);
      return;
    }

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

  return {
    displayCode,
    displayCss,
    displayAltNode,
    isLoadingCode,
  };
}
