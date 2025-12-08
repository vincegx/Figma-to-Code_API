'use client';

/**
 * useMergesData Hook
 *
 * Handles data fetching, filtering, sorting, pagination for the Merges page.
 * VERBATIM from merges/page.tsx - Phase 3 refactoring
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MergeListItem, MergeStatus } from '@/lib/types/merge';
import type { SortOption } from '@/components/library/sort-select';

type StatusFilter = MergeStatus | 'all';

export function useMergesData() {
  // Data state
  const [merges, setMerges] = useState<MergeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Sort, Pagination state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Selection state
  const [selectedMergeIds, setSelectedMergeIds] = useState<Set<string>>(new Set());

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MergeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch merges
  const fetchMerges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/merges');
      if (!response.ok) {
        throw new Error('Failed to fetch merges');
      }
      const data = await response.json();
      setMerges(data.merges || []);
    } catch (error) {
      console.error('Failed to fetch merges:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerges();
  }, [fetchMerges]);

  // Filtered merges
  const filteredMerges = useMemo(() => {
    let result = merges;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.sourceNodes.some((n) => n.nodeName.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    return result;
  }, [merges, searchQuery, statusFilter]);

  // Sorted merges
  const sortedMerges = useMemo(() => {
    return [...filteredMerges].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'nodes-desc':
          return (b.warningCount || 0) - (a.warningCount || 0);
        default:
          return 0;
      }
    });
  }, [filteredMerges, sortBy]);

  // Paginated merges
  const paginatedMerges = useMemo(() => {
    return sortedMerges.slice((page - 1) * perPage, page * perPage);
  }, [sortedMerges, page, perPage]);

  // Reset page when filters/sort/search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Toggle selection
  const toggleSelection = (mergeId: string) => {
    const newSelection = new Set(selectedMergeIds);
    if (newSelection.has(mergeId)) {
      newSelection.delete(mergeId);
    } else {
      newSelection.add(mergeId);
    }
    setSelectedMergeIds(newSelection);
  };

  // Select/deselect all on current page
  const toggleSelectAll = () => {
    if (selectedMergeIds.size === paginatedMerges.length) {
      setSelectedMergeIds(new Set());
    } else {
      setSelectedMergeIds(new Set(paginatedMerges.map((m) => m.id)));
    }
  };

  // Check if any filters are active
  const hasFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Handle delete click (opens confirmation)
  const handleDeleteClick = (merge: MergeListItem) => {
    setDeleteTarget(merge);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/merges/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMerges((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      } else {
        console.error('Failed to delete merge');
      }
    } catch (error) {
      console.error('Failed to delete merge:', error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  // Format relative time helper
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return {
    // Data
    merges,
    isLoading,
    filteredMerges,
    sortedMerges,
    paginatedMerges,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    hasFilters,
    clearFilters,

    // Sort & Pagination
    sortBy,
    setSortBy,
    page,
    setPage,
    perPage,
    setPerPage,

    // Selection
    selectedMergeIds,
    toggleSelection,
    toggleSelectAll,

    // Delete
    deleteTarget,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    // Actions
    fetchMerges,

    // Helpers
    formatRelativeTime,
  };
}
