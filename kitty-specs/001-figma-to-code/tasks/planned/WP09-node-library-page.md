---
work_package_id: "WP09"
subtasks:
  - "T076"
  - "T077"
  - "T078"
  - "T079"
  - "T080"
  - "T081"
  - "T082"
  - "T083"
  - "T084"
  - "T085"
  - "T086"
title: "Node Library Page"
phase: "Phase 2 - UI Pages"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-11-24T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP09 – Node Library Page

## Objectives & Success Criteria

Build Node Library page (`app/nodes/page.tsx`) with grid/list view toggle, real-time search, filters (type, coverage), sorting, and bulk actions. This is the primary interface for browsing and managing imported Figma nodes.

**Success Criteria**:
- Display all imported nodes in grid or list view
- Toggle view mode: grid (cards with thumbnails) ↔ list (table with columns)
- Search: Real-time filtering by node name
- Filter: By node type (FRAME, TEXT, GROUP, COMPONENT) and coverage range
- Sort: By name, date, type, coverage (ascending/descending)
- Bulk actions: Select multiple nodes, delete all selected
- Individual actions: View (→ `/viewer/{nodeId}`), rename, export, re-fetch, delete
- Success Criteria SC-002: Find specific node via search within 3 seconds (50 nodes)
- Success Criteria SC-003: Toggle view/filter/sort within 1 second (instant UI response)
- User Story 2 (Library Management) fully implemented

## Context & Constraints

**Architecture**: Library page is the central hub for multi-node management (Constitution Principle VIII: Multi-Node Library Management). Users browse, search, filter, and organize imported nodes.

**Key Decisions from Planning**:
- Library data from Zustand nodes-store (loads from `/api/library/index`)
- Grid view: Shadcn/ui Card components in CSS grid (responsive: 1-4 columns)
- List view: Shadcn/ui Table component with sortable columns
- Search/filter/sort: Client-side operations on nodes-store.nodes array (fast, no API calls)
- Bulk actions: Track selected node IDs in component state, call nodes-store.deleteNode() for each

**Constitutional Principles**:
- Principle VIII: Multi-Node Library Management – Library manager for multiple nodes, NOT single-node workbench
- Principle VII: Live Feedback – UI interactions <1s (SC-003)
- Principle III: Data Locality – All operations on cached data, no Figma API calls

**Related Documents**:
- [spec.md](../spec.md) – User Story 2 (Library Management requirements)
- [plan.md](../plan.md) – Library page architecture
- [data-model.md](../data-model.md) – NodeMetadata type
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T076 – Create app/nodes/page.tsx with library grid layout

**Purpose**: Establish Library page component with grid/list view and controls.

**Steps**:
1. Create `app/nodes/page.tsx`:
   ```typescript
   'use client';

   import { useEffect, useState } from 'react';
   import { useNodesStore } from '@/lib/store';
   import NodeCard from '@/components/node-card';
   import { Search, Grid, List, Filter, SortAsc } from 'lucide-react';

   export default function NodesLibraryPage() {
     const nodes = useNodesStore(state => state.nodes);
     const viewMode = useNodesStore(state => state.viewMode);
     const searchTerm = useNodesStore(state => state.searchTerm);
     const filters = useNodesStore(state => state.filters);
     const sortCriteria = useNodesStore(state => state.sortCriteria);
     const loadLibrary = useNodesStore(state => state.loadLibrary);
     const setViewMode = useNodesStore(state => state.setViewMode);
     const setSearchTerm = useNodesStore(state => state.setSearchTerm);
     const setFilters = useNodesStore(state => state.setFilters);
     const setSortCriteria = useNodesStore(state => state.setSortCriteria);

     const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

     // Load library on mount
     useEffect(() => {
       loadLibrary();
     }, [loadLibrary]);

     // Apply filters and search
     const filteredNodes = nodes.filter(node => {
       // Search filter
       if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
         return false;
       }

       // Type filter
       if (filters.type && node.type !== filters.type) {
         return false;
       }

       // Coverage filter
       if (filters.coverage) {
         if (node.coverage < filters.coverage.min || node.coverage > filters.coverage.max) {
           return false;
         }
       }

       return true;
     });

     // Apply sorting
     const sortedNodes = [...filteredNodes].sort((a, b) => {
       const { field, order } = sortCriteria;
       let comparison = 0;

       switch (field) {
         case 'name':
           comparison = a.name.localeCompare(b.name);
           break;
         case 'date':
           comparison = new Date(a.importDate).getTime() - new Date(b.importDate).getTime();
           break;
         case 'type':
           comparison = a.type.localeCompare(b.type);
           break;
         case 'coverage':
           comparison = a.coverage - b.coverage;
           break;
       }

       return order === 'asc' ? comparison : -comparison;
     });

     return (
       <div className="container mx-auto px-4 py-8">
         <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-bold">Node Library</h1>

           {/* View toggle */}
           <div className="flex gap-2">
             <button
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
             >
               <Grid size={20} />
             </button>
             <button
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
             >
               <List size={20} />
             </button>
           </div>
         </div>

         {/* Controls: Search, Filter, Sort */}
         <div className="flex gap-4 mb-6">
           {/* Search (T079) */}
           {/* Filter (T080) */}
           {/* Sort (T081) */}
         </div>

         {/* Bulk actions */}
         {selectedNodeIds.size > 0 && (
           <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
             <span>{selectedNodeIds.size} nodes selected</span>
             <button
               onClick={() => {/* Bulk delete (T082) */}}
               className="px-4 py-2 bg-red-500 text-white rounded-lg"
             >
               Delete Selected
             </button>
           </div>
         )}

         {/* Grid/List view */}
         {viewMode === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {sortedNodes.map(node => (
               <NodeCard
                 key={node.id}
                 node={node}
                 isSelected={selectedNodeIds.has(node.id)}
                 onToggleSelect={(id) => {
                   const newSelected = new Set(selectedNodeIds);
                   if (newSelected.has(id)) {
                     newSelected.delete(id);
                   } else {
                     newSelected.add(id);
                   }
                   setSelectedNodeIds(newSelected);
                 }}
               />
             ))}
           </div>
         ) : (
           <div>{/* List view table (T078) */}</div>
         )}

         {/* Empty state */}
         {sortedNodes.length === 0 && (
           <div className="text-center py-12 text-gray-500">
             {nodes.length === 0 ? (
               <>No nodes imported yet. Go to <a href="/" className="text-blue-500">Homepage</a> to import.</>
             ) : (
               <>No nodes match your filters. Try adjusting your search or filters.</>
             )}
           </div>
         )}
       </div>
     );
   }
   ```

2. Verify page renders with basic layout

**Files**: `app/nodes/page.tsx`

**Parallel?**: No (entry point for library page)

**Notes**:
- Client component: uses Zustand hooks
- filteredNodes: apply search + filters
- sortedNodes: apply sorting on filtered results
- selectedNodeIds: component state for bulk selection
- Grid layout: responsive (1-4 columns based on screen size)
- Empty state: different messages for "no nodes" vs "no matches"

---

### Subtask T077 – Create components/node-card.tsx for grid view

**Purpose**: Display individual node card with thumbnail, name, type, date, coverage badge, checkbox.

**Steps**:
1. Create `components/node-card.tsx`:
   ```typescript
   import Image from 'next/image';
   import Link from 'next/link';
   import { NodeMetadata } from '@/lib/types/library';
   import { MoreVertical } from 'lucide-react';

   interface NodeCardProps {
     node: NodeMetadata;
     isSelected: boolean;
     onToggleSelect: (nodeId: string) => void;
   }

   export default function NodeCard({ node, isSelected, onToggleSelect }: NodeCardProps) {
     return (
       <div
         className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow relative ${
           isSelected ? 'ring-2 ring-blue-500' : ''
         }`}
       >
         {/* Selection checkbox */}
         <div className="absolute top-2 left-2 z-10">
           <input
             type="checkbox"
             checked={isSelected}
             onChange={() => onToggleSelect(node.id)}
             className="w-5 h-5 rounded cursor-pointer"
             onClick={(e) => e.stopPropagation()} // Prevent card click
           />
         </div>

         {/* Actions menu */}
         <div className="absolute top-2 right-2 z-10">
           <button className="p-2 bg-white/80 dark:bg-gray-700/80 rounded-lg hover:bg-white dark:hover:bg-gray-700">
             <MoreVertical size={16} />
           </button>
         </div>

         {/* Thumbnail */}
         <Link href={`/viewer/${node.id}`}>
           <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
             {node.thumbnailPath ? (
               <Image
                 src={`/${node.thumbnailPath}`}
                 alt={node.name}
                 width={400}
                 height={300}
                 className="object-cover w-full h-full"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                 📦
               </div>
             )}
           </div>
         </Link>

         {/* Card content */}
         <div className="p-4">
           <Link href={`/viewer/${node.id}`}>
             <h3 className="font-semibold text-lg mb-2 truncate hover:text-blue-500">
               {node.name}
             </h3>
           </Link>

           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
             <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
               {node.type}
             </span>
             <span>{new Date(node.importDate).toLocaleDateString()}</span>
           </div>

           {/* Coverage badge */}
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-500">Coverage</span>
             <span
               className={`px-3 py-1 rounded-full text-xs font-medium ${
                 node.coverage >= 80
                   ? 'bg-green-100 text-green-800'
                   : node.coverage >= 50
                   ? 'bg-yellow-100 text-yellow-800'
                   : 'bg-red-100 text-red-800'
               }`}
             >
               {node.coverage}%
             </span>
           </div>
         </div>
       </div>
     );
   }
   ```

2. Test card rendering with sample node

**Files**: `components/node-card.tsx`

**Parallel?**: Yes (can develop concurrently with T078-T083)

**Notes**:
- Checkbox: absolute positioned, top-left corner
- Actions menu: three-dot menu, top-right corner (dropdown in T083)
- Thumbnail: Next.js Image component for optimization, fallback emoji
- Coverage badge: color-coded (green ≥80%, yellow ≥50%, red <50%)
- Click card → navigate to /viewer/{nodeId}
- Selected state: blue ring border

---

### Subtask T078 – Implement grid/list view toggle

**Purpose**: Switch between grid (cards) and list (table) display modes.

**Steps**:
1. Add list view to `app/nodes/page.tsx`:
   ```typescript
   // Inside NodesLibraryPage component, after grid view

   {viewMode === 'list' ? (
     <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
       <table className="w-full">
         <thead className="bg-gray-50 dark:bg-gray-700">
           <tr>
             <th className="px-4 py-3 text-left">
               <input
                 type="checkbox"
                 onChange={(e) => {
                   if (e.target.checked) {
                     setSelectedNodeIds(new Set(sortedNodes.map(n => n.id)));
                   } else {
                     setSelectedNodeIds(new Set());
                   }
                 }}
               />
             </th>
             <th className="px-4 py-3 text-left">Thumbnail</th>
             <th className="px-4 py-3 text-left cursor-pointer" onClick={() => setSortCriteria({ field: 'name', order: sortCriteria.field === 'name' && sortCriteria.order === 'asc' ? 'desc' : 'asc' })}>
               Name {sortCriteria.field === 'name' && (sortCriteria.order === 'asc' ? '↑' : '↓')}
             </th>
             <th className="px-4 py-3 text-left">Type</th>
             <th className="px-4 py-3 text-left cursor-pointer" onClick={() => setSortCriteria({ field: 'date', order: sortCriteria.order === 'asc' ? 'desc' : 'asc' })}>
               Import Date
             </th>
             <th className="px-4 py-3 text-left cursor-pointer" onClick={() => setSortCriteria({ field: 'coverage', order: sortCriteria.order === 'asc' ? 'desc' : 'asc' })}>
               Coverage
             </th>
             <th className="px-4 py-3 text-right">Actions</th>
           </tr>
         </thead>
         <tbody>
           {sortedNodes.map(node => (
             <tr key={node.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
               <td className="px-4 py-3">
                 <input
                   type="checkbox"
                   checked={selectedNodeIds.has(node.id)}
                   onChange={() => {
                     const newSelected = new Set(selectedNodeIds);
                     if (newSelected.has(node.id)) {
                       newSelected.delete(node.id);
                     } else {
                       newSelected.add(node.id);
                     }
                     setSelectedNodeIds(newSelected);
                   }}
                 />
               </td>
               <td className="px-4 py-3">
                 <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                   {node.thumbnailPath ? (
                     <Image src={`/${node.thumbnailPath}`} alt={node.name} width={48} height={48} className="object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                   )}
                 </div>
               </td>
               <td className="px-4 py-3">
                 <Link href={`/viewer/${node.id}`} className="font-medium hover:text-blue-500">
                   {node.name}
                 </Link>
               </td>
               <td className="px-4 py-3">
                 <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                   {node.type}
                 </span>
               </td>
               <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                 {new Date(node.importDate).toLocaleDateString()}
               </td>
               <td className="px-4 py-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                   node.coverage >= 80 ? 'bg-green-100 text-green-800' :
                   node.coverage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                   'bg-red-100 text-red-800'
                 }`}>
                   {node.coverage}%
                 </span>
               </td>
               <td className="px-4 py-3 text-right">
                 {/* Actions dropdown (T083) */}
               </td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
   ) : (
     // Grid view
   )}
   ```

2. Test view toggle: click Grid icon → cards, click List icon → table

**Files**: `app/nodes/page.tsx`

**Parallel?**: No (modifies T076)

**Notes**:
- View mode state: nodes-store.viewMode (persisted in localStorage via WP07)
- Grid view: responsive CSS grid (1-4 columns)
- List view: Shadcn/ui Table with sortable column headers
- Checkbox in table header: select/deselect all visible nodes
- Click column header → toggle sort order (asc/desc)
- Success Criteria SC-003: View toggle <1s (instant UI response)

---

### Subtask T079 – Create search input with real-time filtering

**Purpose**: Search nodes by name with real-time filtering (no debounce needed, client-side fast).

**Steps**:
1. Add search input to controls section in `app/nodes/page.tsx`:
   ```typescript
   <div className="flex gap-4 mb-6">
     {/* Search */}
     <div className="flex-1 relative">
       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
       <input
         type="text"
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
         placeholder="Search nodes by name..."
         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
       />
       {searchTerm && (
         <button
           onClick={() => setSearchTerm('')}
           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
         >
           ✕
         </button>
       )}
     </div>

     {/* Filter and Sort dropdowns (T080, T081) */}
   </div>
   ```

2. Test search:
   - Type "Button" → only nodes with "Button" in name show
   - Clear search (✕ button) → all nodes show
   - Verify real-time filtering (no delay)

**Files**: `app/nodes/page.tsx`

**Parallel?**: Yes (can develop concurrently with T080-T081)

**Notes**:
- Search updates nodes-store.searchTerm immediately (no debounce - client-side fast)
- Case-insensitive search: `.toLowerCase()` comparison
- Clear button (✕) appears when searchTerm not empty
- Success Criteria SC-002: Find specific node within 3 seconds (50 nodes) - search is instant, includes visual scan time

---

### Subtask T080 – Create filter dropdown by node type and coverage

**Purpose**: Filter nodes by type (FRAME, TEXT, etc.) and coverage range.

**Steps**:
1. Add filter dropdown to controls:
   ```typescript
   import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

   {/* Filter dropdown */}
   <Popover>
     <PopoverTrigger asChild>
       <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
         <Filter size={16} />
         Filter
         {(filters.type || filters.coverage) && (
           <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
             {[filters.type, filters.coverage].filter(Boolean).length}
           </span>
         )}
       </button>
     </PopoverTrigger>
     <PopoverContent className="w-80">
       <div className="space-y-4">
         <div>
           <label className="block text-sm font-medium mb-2">Node Type</label>
           <select
             value={filters.type || ''}
             onChange={(e) => setFilters({ type: e.target.value || null })}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg"
           >
             <option value="">All Types</option>
             <option value="FRAME">FRAME</option>
             <option value="TEXT">TEXT</option>
             <option value="RECTANGLE">RECTANGLE</option>
             <option value="GROUP">GROUP</option>
             <option value="COMPONENT">COMPONENT</option>
             <option value="INSTANCE">INSTANCE</option>
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium mb-2">Coverage Range</label>
           <div className="flex gap-2 items-center">
             <input
               type="number"
               placeholder="Min"
               value={filters.coverage?.min || ''}
               onChange={(e) => setFilters({
                 coverage: {
                   min: parseInt(e.target.value) || 0,
                   max: filters.coverage?.max || 100,
                 }
               })}
               className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
             />
             <span>to</span>
             <input
               type="number"
               placeholder="Max"
               value={filters.coverage?.max || ''}
               onChange={(e) => setFilters({
                 coverage: {
                   min: filters.coverage?.min || 0,
                   max: parseInt(e.target.value) || 100,
                 }
               })}
               className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
             />
             <span>%</span>
           </div>
         </div>

         <button
           onClick={() => setFilters({ type: null, coverage: null })}
           className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
         >
           Clear Filters
         </button>
       </div>
     </PopoverContent>
   </Popover>
   ```

2. Test filters:
   - Select "FRAME" type → only FRAME nodes show
   - Set coverage 50-100% → only nodes with ≥50% coverage show
   - Combine filters: type=TEXT + coverage≥80%

**Files**: `app/nodes/page.tsx`

**Parallel?**: Yes (can develop concurrently with T079, T081)

**Notes**:
- Shadcn/ui Popover component for dropdown
- Active filter badge: shows count of active filters
- Coverage range: min/max inputs (0-100%)
- Clear Filters button: resets all filters
- Success Criteria SC-003: Filter applies <1s (instant)

---

### Subtask T081 – Create sort dropdown (name, date, type, coverage) with asc/desc order

**Purpose**: Sort nodes by various criteria with ascending/descending order.

**Steps**:
1. Add sort dropdown to controls:
   ```typescript
   <Popover>
     <PopoverTrigger asChild>
       <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
         <SortAsc size={16} />
         Sort: {sortCriteria.field} ({sortCriteria.order})
       </button>
     </PopoverTrigger>
     <PopoverContent className="w-64">
       <div className="space-y-2">
         <div>
           <label className="block text-sm font-medium mb-2">Sort By</label>
           <select
             value={sortCriteria.field}
             onChange={(e) => setSortCriteria({ ...sortCriteria, field: e.target.value as any })}
             className="w-full px-3 py-2 border border-gray-300 rounded-lg"
           >
             <option value="name">Name</option>
             <option value="date">Import Date</option>
             <option value="type">Type</option>
             <option value="coverage">Coverage</option>
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium mb-2">Order</label>
           <div className="flex gap-2">
             <button
               onClick={() => setSortCriteria({ ...sortCriteria, order: 'asc' })}
               className={`flex-1 px-3 py-2 rounded-lg ${sortCriteria.order === 'asc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
             >
               Ascending
             </button>
             <button
               onClick={() => setSortCriteria({ ...sortCriteria, order: 'desc' })}
               className={`flex-1 px-3 py-2 rounded-lg ${sortCriteria.order === 'desc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
             >
               Descending
             </button>
           </div>
         </div>
       </div>
     </PopoverContent>
   </Popover>
   ```

2. Test sorting:
   - Sort by Name (asc) → alphabetical A-Z
   - Sort by Date (desc) → newest first
   - Sort by Coverage (desc) → highest coverage first

**Files**: `app/nodes/page.tsx`

**Parallel?**: Yes (can develop concurrently with T079-T080)

**Notes**:
- Sort dropdown shows current sort criteria (field + order)
- Sort field: name, date, type, coverage
- Sort order: asc (ascending) or desc (descending)
- Success Criteria SC-003: Sort applies <1s (instant)

---

### Subtask T082 – Implement bulk selection: checkboxes on cards, "Delete Selected" button

**Purpose**: Select multiple nodes and delete them in bulk.

**Steps**:
1. Bulk delete implementation already in T076, add confirmation dialog:
   ```typescript
   import { useState } from 'react';

   const [showDeleteDialog, setShowDeleteDialog] = useState(false);

   const handleBulkDelete = async () => {
     if (!confirm(`Delete ${selectedNodeIds.size} nodes? This cannot be undone.`)) {
       return;
     }

     // Delete each selected node
     for (const nodeId of selectedNodeIds) {
       await fetch(`/api/library/node/${nodeId}`, { method: 'DELETE' });
       useNodesStore.getState().deleteNode(nodeId);
     }

     // Clear selection
     setSelectedNodeIds(new Set());

     // Reload library
     await loadLibrary();

     // TODO: Show success toast
     console.log(`Deleted ${selectedNodeIds.size} nodes`);
   };
   ```

2. Test bulk delete:
   - Select 3 nodes via checkboxes
   - Click "Delete Selected"
   - Confirm dialog → nodes deleted
   - Verify nodes removed from library

**Files**: `app/nodes/page.tsx`

**Parallel?**: No (modifies T076)

**Notes**:
- selectedNodeIds: Set<string> in component state
- Checkbox on each card (T077) toggles selection
- Bulk delete banner shows when selectedNodeIds.size > 0
- Confirmation dialog: native confirm() for MVP (replace with Shadcn/ui Dialog later)
- Delete API call: DELETE /api/library/node/{nodeId} (WP03)
- State update: nodes-store.deleteNode() for each node

---

### Subtask T083 – Add individual node actions: view, rename, export, re-fetch, delete

**Purpose**: Actions menu for each node card (dropdown with 5 actions).

**Steps**:
1. Create actions dropdown in `components/node-card.tsx`:
   ```typescript
   import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
   import { Eye, Edit, Download, RefreshCw, Trash2 } from 'lucide-react';

   {/* Actions menu (replace MoreVertical button) */}
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <button className="p-2 bg-white/80 dark:bg-gray-700/80 rounded-lg hover:bg-white dark:hover:bg-gray-700">
         <MoreVertical size={16} />
       </button>
     </DropdownMenuTrigger>
     <DropdownMenuContent>
       <DropdownMenuItem onClick={() => window.location.href = `/viewer/${node.id}`}>
         <Eye size={16} className="mr-2" /> View
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => {/* Rename modal */}}>
         <Edit size={16} className="mr-2" /> Rename
       </DropdownMenuItem>
       <DropdownMenuItem onClick={() => {/* Export dialog */}}>
         <Download size={16} className="mr-2" /> Export
       </DropdownMenuItem>
       <DropdownMenuItem onClick={async () => {
         // Re-fetch from Figma API
         await fetch(`/api/figma/refresh`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ nodeId: node.id }),
         });
         // Reload library
         await useNodesStore.getState().loadLibrary();
       }}>
         <RefreshCw size={16} className="mr-2" /> Re-fetch
       </DropdownMenuItem>
       <DropdownMenuItem
         onClick={async () => {
           if (confirm(`Delete "${node.name}"? This cannot be undone.`)) {
             await fetch(`/api/library/node/${node.id}`, { method: 'DELETE' });
             useNodesStore.getState().deleteNode(node.id);
           }
         }}
         className="text-red-600"
       >
         <Trash2 size={16} className="mr-2" /> Delete
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
   ```

2. Test actions:
   - View → navigate to /viewer/{nodeId}
   - Rename → show dialog (placeholder for MVP)
   - Export → show format dialog (placeholder for MVP)
   - Re-fetch → call Figma API, update cache
   - Delete → confirm, delete node

**Files**: `components/node-card.tsx`

**Parallel?**: Yes (can develop concurrently with T076-T082)

**Notes**:
- Shadcn/ui DropdownMenu component
- lucide-react icons for actions
- View: navigate to Viewer page
- Rename: TODO (show modal with input, update metadata)
- Export: TODO (show format dialog, generate code)
- Re-fetch: calls /api/figma/refresh (WP03)
- Delete: confirmation dialog, API call, state update
- Delete menu item styled red for danger

---

### Subtask T084 – Test library management: import 10 nodes, search, filter, sort, bulk delete 3 nodes

**Purpose**: End-to-end validation of library page functionality.

**Steps**:
1. Create E2E test `__tests__/e2e/library-page.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Node Library Page', () => {
     test('should display all imported nodes', async ({ page }) => {
       await page.goto('/nodes');

       // Verify page title
       await expect(page.getByText('Node Library')).toBeVisible();

       // Verify grid/list toggle visible
       await expect(page.locator('button').filter({ hasText: 'Grid' })).toBeVisible();
       await expect(page.locator('button').filter({ hasText: 'List' })).toBeVisible();
     });

     test('should toggle between grid and list view', async ({ page }) => {
       await page.goto('/nodes');

       // Click List button
       await page.click('button:has-text("List")');
       await expect(page.locator('table')).toBeVisible();

       // Click Grid button
       await page.click('button:has-text("Grid")');
       await expect(page.locator('table')).not.toBeVisible();
     });

     test('should search nodes by name', async ({ page }) => {
       await page.goto('/nodes');

       // Type in search
       await page.fill('input[placeholder*="Search"]', 'Button');

       // Verify only matching nodes shown
       const nodeCards = page.locator('[data-testid="node-card"]');
       const count = await nodeCards.count();
       expect(count).toBeGreaterThan(0);

       // Verify all visible cards contain "Button"
       for (let i = 0; i < count; i++) {
         const text = await nodeCards.nth(i).textContent();
         expect(text?.toLowerCase()).toContain('button');
       }
     });

     test('should filter nodes by type', async ({ page }) => {
       await page.goto('/nodes');

       // Open filter dropdown
       await page.click('button:has-text("Filter")');

       // Select FRAME type
       await page.selectOption('select', 'FRAME');

       // Close dropdown
       await page.keyboard.press('Escape');

       // Verify filter badge shows "1"
       await expect(page.locator('button:has-text("Filter")').locator('span:has-text("1")')).toBeVisible();
     });

     test('should sort nodes by coverage', async ({ page }) => {
       await page.goto('/nodes');

       // Open sort dropdown
       await page.click('button:has-text("Sort")');

       // Select Coverage + Descending
       await page.selectOption('select', 'coverage');
       await page.click('button:has-text("Descending")');

       // Close dropdown
       await page.keyboard.press('Escape');

       // Verify first node has highest coverage (manual inspection or data-testid)
     });

     test('should bulk delete nodes', async ({ page }) => {
       await page.goto('/nodes');

       // Select 3 nodes
       const checkboxes = page.locator('input[type="checkbox"]');
       await checkboxes.nth(1).check(); // Skip header checkbox
       await checkboxes.nth(2).check();
       await checkboxes.nth(3).check();

       // Verify bulk action banner
       await expect(page.getByText('3 nodes selected')).toBeVisible();

       // Click Delete Selected
       await page.click('button:has-text("Delete Selected")');

       // Confirm deletion
       page.on('dialog', dialog => dialog.accept());

       // Wait for deletion to complete
       await page.waitForTimeout(1000);

       // Verify nodes removed (manual inspection)
     });
   });
   ```

2. Run E2E tests:
   ```bash
   npm run test:e2e library-page.spec.ts
   ```

3. Manual testing checklist:
   - [ ] Navigate to /nodes, see all nodes
   - [ ] Toggle grid/list view
   - [ ] Search "Button" → filter works
   - [ ] Filter by FRAME type → filter works
   - [ ] Sort by coverage desc → highest coverage first
   - [ ] Select 3 nodes → bulk action banner shows
   - [ ] Delete 3 nodes → nodes removed
   - [ ] Click node card → navigate to /viewer/{nodeId}
   - [ ] Actions menu: View, Rename, Export, Re-fetch, Delete

**Files**: `__tests__/e2e/library-page.spec.ts`

**Parallel?**: No (requires all components complete)

**Notes**:
- E2E tests validate complete library management workflow
- Data-testid attributes can be added for easier testing
- Manual testing complements E2E tests for UI/UX validation

---

### Subtask T085 – Verify Success Criteria SC-002: Find specific node via search within 3 seconds

**Purpose**: Validate search performance meets success criteria.

**Steps**:
1. Performance test with 50 nodes:
   ```typescript
   test('should find node via search within 3 seconds (SC-002)', async ({ page }) => {
     await page.goto('/nodes');

     // Ensure library has 50+ nodes (seed data)
     const nodeCount = await page.locator('[data-testid="node-card"]').count();
     expect(nodeCount).toBeGreaterThanOrEqual(50);

     // Start timer
     const startTime = Date.now();

     // Type search query
     await page.fill('input[placeholder*="Search"]', 'TargetNodeName');

     // Wait for results to filter
     await page.waitForSelector('[data-testid="node-card"]');

     // End timer
     const endTime = Date.now();
     const duration = endTime - startTime;

     // Verify performance
     expect(duration).toBeLessThan(3000); // Success Criteria SC-002

     console.log(`Search completed in ${duration}ms`);
   });
   ```

2. Verify search is instant (<100ms client-side filtering)

**Files**: `__tests__/e2e/library-page.spec.ts`

**Parallel?**: No (performance validation)

**Notes**:
- Success Criteria SC-002: Find specific node via search within 3 seconds (50 nodes)
- Search is client-side filtering (instant), 3s includes user visual scan time
- Real-world: typing + visual scan + click = <3s total

---

### Subtask T086 – Verify Success Criteria SC-003: Toggle view/filter/sort within 1 second

**Purpose**: Validate UI interaction performance meets success criteria.

**Steps**:
1. Performance test for UI interactions:
   ```typescript
   test('should toggle view/filter/sort within 1 second (SC-003)', async ({ page }) => {
     await page.goto('/nodes');

     // Test view toggle
     let startTime = Date.now();
     await page.click('button:has-text("List")');
     await page.waitForSelector('table');
     let duration = Date.now() - startTime;
     expect(duration).toBeLessThan(1000); // Success Criteria SC-003

     // Test filter
     startTime = Date.now();
     await page.click('button:has-text("Filter")');
     await page.selectOption('select', 'FRAME');
     await page.keyboard.press('Escape');
     duration = Date.now() - startTime;
     expect(duration).toBeLessThan(1000);

     // Test sort
     startTime = Date.now();
     await page.click('button:has-text("Sort")');
     await page.selectOption('select', 'coverage');
     await page.keyboard.press('Escape');
     duration = Date.now() - startTime;
     expect(duration).toBeLessThan(1000);
   });
   ```

2. Verify all interactions are instant (<100ms)

**Files**: `__tests__/e2e/library-page.spec.ts`

**Parallel?**: No (performance validation)

**Notes**:
- Success Criteria SC-003: Toggle view/filter/sort within 1 second (instant UI response)
- Client-side operations should be <100ms (React re-render)
- 1s threshold includes network latency buffer (no network calls needed)

## Definition of Done Checklist

- [ ] `app/nodes/page.tsx` created with grid/list view layout
- [ ] `components/node-card.tsx` created with thumbnail, name, type, date, coverage
- [ ] Grid/list view toggle implemented (updates nodes-store.viewMode)
- [ ] Search input with real-time filtering (updates nodes-store.searchTerm)
- [ ] Filter dropdown by type and coverage range
- [ ] Sort dropdown by name, date, type, coverage (asc/desc)
- [ ] Bulk selection with checkboxes and "Delete Selected" button
- [ ] Individual node actions: View, Rename, Export, Re-fetch, Delete
- [ ] E2E tests written and passing (library-page.spec.ts)
- [ ] Success Criteria SC-002 verified: Search within 3 seconds (50 nodes)
- [ ] Success Criteria SC-003 verified: UI interactions <1 second
- [ ] User Story 2 (Library Management) fully implemented
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. Grid view responsive (1-4 columns based on screen size)
2. List view table with sortable column headers
3. Search real-time, case-insensitive filtering
4. Filter by type + coverage range (combinable with search)
5. Sort by 4 fields with asc/desc order
6. Bulk selection: checkboxes + "Delete Selected" button
7. Actions menu: 5 actions (View, Rename, Export, Re-fetch, Delete)
8. Performance: Search <3s, UI interactions <1s (Success Criteria SC-002, SC-003)

**Reviewers should verify**:
- No `any` types in components (TypeScript strict mode)
- View mode persisted in localStorage (nodes-store.viewMode)
- Search/filter/sort state persisted across page navigation (nodes-store)
- Empty state messages: "No nodes" vs "No matches"
- Coverage badge color-coded correctly (green ≥80%, yellow ≥50%, red <50%)
- Actions dropdown: click outside closes, ESC key closes
- Bulk delete confirmation dialog: prevents accidental deletion
- Performance: 100 nodes library renders in <500ms

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
