import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { LibraryNode } from '../types/library';

/**
 * NodesState: Multi-node library management
 *
 * State:
 * - nodes: Array of imported node metadata (from library-index.json)
 * - selectedNodeId: Currently selected node (for Viewer page)
 * - viewMode: 'grid' | 'list' (library page display mode)
 * - searchTerm: Search filter text
 * - filters: Active filters (type, coverage)
 * - sortCriteria: Sort field and order
 */
export interface NodesState {
  // Data
  nodes: LibraryNode[];
  selectedNodeId: string | null;

  // UI preferences (persisted in localStorage)
  viewMode: 'grid' | 'list';
  searchTerm: string;
  filters: {
    type: string | null; // FRAME, TEXT, etc.
    coverage: { min: number; max: number } | null;
  };
  sortCriteria: {
    field: 'name' | 'date' | 'type' | 'coverage';
    order: 'asc' | 'desc';
  };

  // Actions
  loadLibrary: () => Promise<void>;
  importNode: (node: LibraryNode) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<NodesState['filters']>) => void;
  setSortCriteria: (criteria: Partial<NodesState['sortCriteria']>) => void;
}

/**
 * Create nodes store with DevTools and persistence
 */
export const useNodesStore = create<NodesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        nodes: [],
        selectedNodeId: null,
        viewMode: 'grid',
        searchTerm: '',
        filters: {
          type: null,
          coverage: null,
        },
        sortCriteria: {
          field: 'date',
          order: 'desc',
        },

        // Actions (loadLibrary will be implemented in T059)
        loadLibrary: async () => {
          try {
            // Fetch library index from API route (WP03)
            const response = await fetch('/api/figma/library');
            if (!response.ok) {
              throw new Error('Failed to load library index');
            }

            const data = await response.json();
            const nodes: LibraryNode[] = data.nodes || [];

            set({ nodes });
          } catch (error) {
            console.error('Failed to load library:', error);
            // TODO: Show toast error (will be implemented in WP08/WP09)
          }
        },

        importNode: (node: LibraryNode) => {
          set((state) => ({
            nodes: [...state.nodes, node],
          }));
        },

        deleteNode: (nodeId: string) => {
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            selectedNodeId:
              state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          }));
        },

        selectNode: (nodeId: string | null) => {
          set({ selectedNodeId: nodeId });
        },

        setViewMode: (mode: 'grid' | 'list') => {
          set({ viewMode: mode });
        },

        setSearchTerm: (term: string) => {
          set({ searchTerm: term });
        },

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
          }));
        },

        setSortCriteria: (criteria) => {
          set((state) => ({
            sortCriteria: { ...state.sortCriteria, ...criteria },
          }));
        },
      }),
      {
        name: 'nodes-store', // localStorage key
        partialize: (state) => ({
          // Persist UI preferences only, NOT nodes data (loaded from filesystem)
          viewMode: state.viewMode,
          searchTerm: state.searchTerm,
          filters: state.filters,
          sortCriteria: state.sortCriteria,
        }),
      }
    ),
    { name: 'NodesStore' } // DevTools name
  )
);
