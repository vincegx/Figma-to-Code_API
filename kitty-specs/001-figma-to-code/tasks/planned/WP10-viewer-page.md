---
work_package_id: "WP10"
subtasks:
  - "T087"
  - "T088"
  - "T089"
  - "T090"
  - "T091"
  - "T092"
  - "T093"
  - "T094"
  - "T095"
  - "T096"
  - "T097"
  - "T098"
  - "T099"
title: "Viewer Page"
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

# Work Package Prompt: WP10 – Viewer Page

## Objectives & Success Criteria

Build Viewer page (`app/viewer/[nodeId]/page.tsx`) with 2 tabs: Code tab (Figma tree + Applied Rules Inspector) and Render tab (preview with format switcher). This is the primary interface for inspecting nodes and understanding rule application.

**Success Criteria**:
- Code tab: Hierarchical Figma tree (left) + Applied Rules Inspector (right)
- Tree click: Updates inspector to show matched rules, priority resolution, conflicts
- Applied Rules Inspector shows: matched rules by priority, property provenance, conflicts (yellow/red), coverage stats
- Render tab: Full-width code preview with format switcher (React JSX, React+Tailwind, HTML/CSS)
- Format switch: Preview updates with selected framework output
- Export dropdown: Copy to clipboard, download code file
- Success Criteria SC-006: Tree click → inspector update <200ms
- Success Criteria SC-007: Format switch → preview update <500ms
- Success Criteria SC-008: Inspector clarity allows understanding conflicts without external docs
- User Story 4 (Viewer) fully implemented

## Context & Constraints

**Architecture**: Viewer page is the inspection and validation interface. Users click nodes in tree to see which rules apply, how conflicts are resolved, and what code is generated.

**Key Decisions from Planning**:
- Dynamic route: `app/viewer/[nodeId]/page.tsx` receives nodeId from params
- Load node data from Zustand nodes-store or API if not cached
- Code tab: ResizablePanels (Shadcn/ui) with tree (left 40%) and inspector (right 60%)
- Render tab: Full-width iframe with generated code, format selector in header
- Applied Rules Inspector: Evaluate rules for clicked node (WP05 rule engine), display RuleMatch[] with provenance

**Constitutional Principles**:
- Principle VII: Live Feedback – Tree click <200ms, format switch <500ms (SC-006, SC-007)
- Principle IX: Separation of Pages – Viewer is read-only inspection, Rule Manager is editing
- Principle VIII: Multi-Node Library Management – Prev/next navigation between nodes

**Related Documents**:
- [spec.md](../spec.md) – User Story 4 (Viewer requirements)
- [plan.md](../plan.md) – Viewer page architecture
- [data-model.md](../data-model.md) – AltNode, RuleMatch types
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T087 – Create app/viewer/[nodeId]/page.tsx with tabs layout

**Purpose**: Establish Viewer page component with Code/Render tabs.

**Steps**:
1. Create `app/viewer/[nodeId]/page.tsx`:
   ```typescript
   'use client';

   import { useEffect, useState } from 'react';
   import { useParams } from 'next/navigation';
   import { useNodesStore, useRulesStore } from '@/lib/store';
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import FigmaTreeView from '@/components/figma-tree-view';
   import AppliedRulesInspector from '@/components/applied-rules-inspector';
   import PreviewTabs from '@/components/preview-tabs';

   export default function ViewerPage() {
     const params = useParams();
     const nodeId = params.nodeId as string;

     const nodes = useNodesStore(state => state.nodes);
     const loadLibrary = useNodesStore(state => state.loadLibrary);
     const rules = useRulesStore(state => state.rules);
     const loadRules = useRulesStore(state => state.loadRules);

     const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);
     const [activeTab, setActiveTab] = useState<'code' | 'render'>('code');

     // Find current node
     const currentNode = nodes.find(n => n.id === nodeId);

     // Load data on mount
     useEffect(() => {
       loadLibrary();
       loadRules();
     }, [loadLibrary, loadRules]);

     // TODO: Load AltNode from cache (WP04 integration)
     const altNode = null; // Placeholder

     if (!currentNode) {
       return (
         <div className="container mx-auto px-4 py-8">
           <div className="text-center">
             <h1 className="text-2xl font-bold mb-4">Node not found</h1>
             <a href="/nodes" className="text-blue-500">
               Return to Library
             </a>
           </div>
         </div>
       );
     }

     return (
       <div className="h-screen flex flex-col">
         {/* Header (T088) */}
         <div className="border-b border-gray-200 p-4">
           <div className="container mx-auto flex items-center justify-between">
             <div className="flex items-center gap-4">
               {/* Breadcrumbs (T089) */}
               <nav className="text-sm">
                 <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
                 {' > '}
                 <a href="/nodes" className="text-gray-500 hover:text-gray-700">Library</a>
                 {' > '}
                 <span className="font-semibold">{currentNode.name}</span>
               </nav>
             </div>

             <div className="flex items-center gap-2">
               {/* Prev/Next navigation */}
               {/* Re-fetch button */}
               {/* Export dropdown */}
               {/* "Edit Rules" button */}
             </div>
           </div>
         </div>

         {/* Tabs */}
         <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
           <TabsList className="w-full justify-start border-b">
             <TabsTrigger value="code">Code</TabsTrigger>
             <TabsTrigger value="render">Render</TabsTrigger>
           </TabsList>

           {/* Code Tab */}
           <TabsContent value="code" className="flex-1 flex">
             {/* ResizablePanels: Tree (left) + Inspector (right) */}
             <div className="flex-1 flex">
               <div className="w-2/5 border-r border-gray-200 overflow-auto">
                 <FigmaTreeView
                   altNode={altNode}
                   selectedNodeId={selectedTreeNodeId}
                   onNodeClick={(id) => setSelectedTreeNodeId(id)}
                 />
               </div>
               <div className="w-3/5 overflow-auto">
                 <AppliedRulesInspector
                   altNode={altNode}
                   selectedNodeId={selectedTreeNodeId}
                   rules={rules}
                 />
               </div>
             </div>
           </TabsContent>

           {/* Render Tab */}
           <TabsContent value="render" className="flex-1">
             <PreviewTabs altNode={altNode} rules={rules} />
           </TabsContent>
         </Tabs>
       </div>
     );
   }
   ```

2. Verify page renders with tabs (placeholders for components)

**Files**: `app/viewer/[nodeId]/page.tsx`

**Parallel?**: No (entry point for Viewer page)

**Notes**:
- Dynamic route: nodeId from useParams()
- Load library + rules on mount
- selectedTreeNodeId: component state for tree selection
- activeTab: 'code' | 'render'
- Code tab: 40% tree, 60% inspector (ResizablePanels for adjustable split)
- Render tab: full-width preview

---

### Subtask T088 – Create header: node thumbnail (expandable), name, prev/next navigation, re-fetch, export dropdown, "Edit Rules" button

**Purpose**: Viewer header with metadata and actions.

**Steps**:
1. Add header to `app/viewer/[nodeId]/page.tsx`:
   ```typescript
   import { ChevronLeft, ChevronRight, RefreshCw, Download, Settings } from 'lucide-react';

   {/* Header */}
   <div className="border-b border-gray-200 p-4">
     <div className="container mx-auto flex items-center justify-between">
       {/* Left: Thumbnail + Name */}
       <div className="flex items-center gap-4">
         {/* Thumbnail (expandable) */}
         <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500">
           {currentNode.thumbnailPath ? (
             <Image
               src={`/${currentNode.thumbnailPath}`}
               alt={currentNode.name}
               width={48}
               height={48}
               className="object-cover"
               onClick={() => {/* Open thumbnail modal */}}
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400">
               📦
             </div>
           )}
         </div>

         <div>
           <h1 className="text-xl font-bold">{currentNode.name}</h1>
           <div className="text-sm text-gray-500">
             {currentNode.type} • {new Date(currentNode.importDate).toLocaleDateString()}
           </div>
         </div>
       </div>

       {/* Right: Actions */}
       <div className="flex items-center gap-2">
         {/* Prev/Next navigation */}
         <button
           onClick={() => {
             const currentIndex = nodes.findIndex(n => n.id === nodeId);
             const prevNode = nodes[currentIndex - 1];
             if (prevNode) {
               window.location.href = `/viewer/${prevNode.id}`;
             }
           }}
           disabled={nodes.findIndex(n => n.id === nodeId) === 0}
           className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <ChevronLeft size={20} />
         </button>
         <button
           onClick={() => {
             const currentIndex = nodes.findIndex(n => n.id === nodeId);
             const nextNode = nodes[currentIndex + 1];
             if (nextNode) {
               window.location.href = `/viewer/${nextNode.id}`;
             }
           }}
           disabled={nodes.findIndex(n => n.id === nodeId) === nodes.length - 1}
           className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <ChevronRight size={20} />
         </button>

         {/* Re-fetch */}
         <button
           onClick={async () => {
             await fetch('/api/figma/refresh', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ nodeId }),
             });
             await loadLibrary();
           }}
           className="p-2 rounded-lg hover:bg-gray-100"
         >
           <RefreshCw size={20} />
         </button>

         {/* Export dropdown */}
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <button className="p-2 rounded-lg hover:bg-gray-100">
               <Download size={20} />
             </button>
           </DropdownMenuTrigger>
           <DropdownMenuContent>
             <DropdownMenuItem onClick={() => {/* Copy to clipboard */}}>
               Copy to Clipboard
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => {/* Download file */}}>
               Download Code File
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>

         {/* "Edit Rules" button */}
         <button
           onClick={() => window.location.href = `/rules?nodeId=${nodeId}`}
           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
         >
           <Settings size={16} />
           Edit Rules
         </button>
       </div>
     </div>
   </div>
   ```

2. Test header actions:
   - Click thumbnail → expand modal (TODO)
   - Prev/Next → navigate between nodes
   - Re-fetch → call Figma API, reload library
   - Export → copy or download code
   - Edit Rules → navigate to /rules with nodeId query param

**Files**: `app/viewer/[nodeId]/page.tsx`

**Parallel?**: Yes (can develop concurrently with T089-T096)

**Notes**:
- Thumbnail expandable: click opens modal with full-size screenshot (TODO enhancement)
- Prev/Next navigation: cycle through nodes in library order
- Disabled state: first node (no prev), last node (no next)
- Re-fetch: calls /api/figma/refresh (WP03)
- Export dropdown: copy or download (T096 implementation)
- "Edit Rules" button: navigate to Rule Manager with nodeId pre-selected

---

### Subtask T089 – Create breadcrumbs: Home > Library > NodeName

**Purpose**: Navigation breadcrumbs for context (already implemented in T087/T088).

**Steps**:
1. Breadcrumbs already in header (T088), verify styling:
   ```typescript
   <nav className="text-sm text-gray-600">
     <a href="/" className="hover:text-gray-900">Home</a>
     {' > '}
     <a href="/nodes" className="hover:text-gray-900">Library</a>
     {' > '}
     <span className="font-semibold text-gray-900">{currentNode.name}</span>
   </nav>
   ```

2. Test breadcrumb navigation:
   - Click "Home" → navigate to /
   - Click "Library" → navigate to /nodes
   - NodeName not clickable (current page)

**Files**: `app/viewer/[nodeId]/page.tsx`

**Parallel?**: Yes (UI enhancement)

**Notes**:
- Breadcrumbs provide context: user knows they're viewing a node from the library
- Separator: ' > ' (can be replaced with chevron icon)
- Current page (NodeName) not clickable, bolded

---

### Subtask T090 – Create components/figma-tree-view.tsx for hierarchical AltNode tree display

**Purpose**: Display Figma node tree with collapsible hierarchy.

**Steps**:
1. Create `components/figma-tree-view.tsx`:
   ```typescript
   import { useState } from 'react';
   import { AltNode } from '@/lib/types/altnode';
   import { ChevronRight, ChevronDown } from 'lucide-react';

   interface FigmaTreeViewProps {
     altNode: AltNode | null;
     selectedNodeId: string | null;
     onNodeClick: (nodeId: string) => void;
   }

   export default function FigmaTreeView({ altNode, selectedNodeId, onNodeClick }: FigmaTreeViewProps) {
     if (!altNode) {
       return (
         <div className="p-4 text-gray-500">
           Loading Figma tree...
         </div>
       );
     }

     return (
       <div className="p-4">
         <h3 className="text-sm font-semibold mb-4 text-gray-600">Figma Tree</h3>
         <TreeNode
           node={altNode}
           level={0}
           selectedNodeId={selectedNodeId}
           onNodeClick={onNodeClick}
         />
       </div>
     );
   }

   interface TreeNodeProps {
     node: AltNode;
     level: number;
     selectedNodeId: string | null;
     onNodeClick: (nodeId: string) => void;
   }

   function TreeNode({ node, level, selectedNodeId, onNodeClick }: TreeNodeProps) {
     const [isExpanded, setIsExpanded] = useState(true);
     const hasChildren = node.children && node.children.length > 0;

     return (
       <div>
         {/* Node row */}
         <div
           className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 ${
             selectedNodeId === node.id ? 'bg-blue-100 text-blue-700' : ''
           }`}
           style={{ paddingLeft: `${level * 16 + 8}px` }}
           onClick={() => onNodeClick(node.id)}
         >
           {/* Expand/collapse icon */}
           {hasChildren ? (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsExpanded(!isExpanded);
               }}
               className="p-0.5 hover:bg-gray-200 rounded"
             >
               {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
             </button>
           ) : (
             <span className="w-5" /> // Spacer for alignment
           )}

           {/* Node type icon */}
           <span className="text-xs text-gray-500 font-mono w-12">
             {node.type.slice(0, 4)}
           </span>

           {/* Node name */}
           <span className="text-sm truncate flex-1">
             {node.name}
           </span>

           {/* Metadata badges */}
           <div className="flex items-center gap-1">
             {/* Invisible badge */}
             {!node.visible && (
               <span className="text-xs px-1 bg-gray-200 rounded" title="Invisible">
                 👁️‍🗨️
               </span>
             )}
             {/* Children count */}
             {hasChildren && (
               <span className="text-xs text-gray-400">
                 {node.children.length}
               </span>
             )}
           </div>
         </div>

         {/* Children (recursive) */}
         {hasChildren && isExpanded && (
           <div>
             {node.children.map(child => (
               <TreeNode
                 key={child.id}
                 node={child}
                 level={level + 1}
                 selectedNodeId={selectedNodeId}
                 onNodeClick={onNodeClick}
               />
             ))}
           </div>
         )}
       </div>
     );
   }
   ```

2. Test tree view:
   - Expand/collapse nodes
   - Click node → selectedNodeId updates
   - Verify indentation (level * 16px)
   - Verify selected state (blue background)

**Files**: `components/figma-tree-view.tsx`

**Parallel?**: Yes (can develop concurrently with T091-T096)

**Notes**:
- Recursive TreeNode component for hierarchical display
- Expand/collapse: ChevronDown (expanded) / ChevronRight (collapsed)
- Indentation: level * 16px padding-left
- Selected state: blue background highlight
- Node type: first 4 characters (FRAM, TEXT, RECT, etc.)
- Invisible badge: shows if node.visible === false
- Children count: displayed next to parent nodes

---

### Subtask T091 – Create components/applied-rules-inspector.tsx for selected node

**Purpose**: Display matched rules, priority resolution, conflicts, coverage stats for selected node.

**Steps**:
1. Create `components/applied-rules-inspector.tsx`:
   ```typescript
   import { AltNode } from '@/lib/types/altnode';
   import { MappingRule, RuleMatch } from '@/lib/types/rule';
   import { evaluateRules } from '@/lib/rule-engine';
   import { AlertCircle, CheckCircle2 } from 'lucide-react';

   interface AppliedRulesInspectorProps {
     altNode: AltNode | null;
     selectedNodeId: string | null;
     rules: MappingRule[];
   }

   export default function AppliedRulesInspector({ altNode, selectedNodeId, rules }: AppliedRulesInspectorProps) {
     if (!altNode) {
       return (
         <div className="p-4 text-gray-500">
           Select a node in the tree to inspect rules
         </div>
       );
     }

     // Find selected node in tree
     const selectedNode = selectedNodeId ? findNodeById(altNode, selectedNodeId) : altNode;

     if (!selectedNode) {
       return (
         <div className="p-4 text-gray-500">
           Node not found in tree
         </div>
       );
     }

     // Evaluate rules for selected node
     const ruleMatches = evaluateRules(selectedNode, rules);

     return (
       <div className="p-4">
         <div className="mb-4">
           <h3 className="text-sm font-semibold text-gray-600 mb-2">Applied Rules</h3>
           <div className="text-sm text-gray-500">
             Node: <span className="font-mono">{selectedNode.name}</span> ({selectedNode.type})
           </div>
         </div>

         {/* Coverage stats */}
         <div className="mb-6 p-4 bg-gray-50 rounded-lg">
           <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium">Coverage</span>
             <span className={`text-lg font-bold ${
               ruleMatches.length > 0 ? 'text-green-600' : 'text-red-600'
             }`}>
               {ruleMatches.length > 0 ? '✓ Covered' : '✗ Not Covered'}
             </span>
           </div>
           <div className="text-xs text-gray-600">
             {ruleMatches.length} rule{ruleMatches.length !== 1 ? 's' : ''} matched
           </div>
         </div>

         {/* Matched rules */}
         {ruleMatches.length === 0 ? (
           <div className="text-center py-8 text-gray-500">
             <AlertCircle size={48} className="mx-auto mb-2 text-gray-300" />
             <p>No rules match this node</p>
             <button
               onClick={() => window.location.href = '/rules'}
               className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
             >
               Create Rule
             </button>
           </div>
         ) : (
           <div className="space-y-4">
             {ruleMatches.map((match, index) => (
               <div key={index} className="border border-gray-200 rounded-lg p-4">
                 {/* Rule header */}
                 <div className="flex items-center justify-between mb-3">
                   <div>
                     <h4 className="font-semibold">{match.ruleName}</h4>
                     <div className="text-xs text-gray-500">
                       Priority: {match.priority} • ID: {match.ruleId}
                     </div>
                   </div>

                   {/* Conflict badge */}
                   {match.severity !== 'none' && (
                     <span className={`px-2 py-1 rounded text-xs font-medium ${
                       match.severity === 'major' ? 'bg-red-100 text-red-800' :
                       'bg-yellow-100 text-yellow-800'
                     }`}>
                       {match.severity === 'major' ? '⚠️ MAJOR' : '⚠️ Minor'} Conflict
                     </span>
                   )}
                 </div>

                 {/* Contributed properties */}
                 <div className="mb-3">
                   <div className="text-xs font-medium text-gray-600 mb-2">
                     Contributed Properties ({match.contributedProperties.length})
                   </div>
                   <div className="bg-gray-50 rounded p-2 space-y-1">
                     {match.contributedProperties.map(prop => (
                       <div key={prop} className="flex items-center gap-2 text-xs">
                         <CheckCircle2 size={12} className="text-green-600" />
                         <span className="font-mono">{prop}</span>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Conflicts */}
                 {match.conflicts.length > 0 && (
                   <div>
                     <div className="text-xs font-medium text-gray-600 mb-2">
                       Conflicted Properties ({match.conflicts.length})
                     </div>
                     <div className="bg-red-50 rounded p-2 space-y-1">
                       {match.conflicts.map(prop => (
                         <div key={prop} className="flex items-center gap-2 text-xs text-red-700">
                           <AlertCircle size={12} />
                           <span className="font-mono">{prop}</span>
                           <span className="text-gray-500">(lost to higher priority)</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             ))}
           </div>
         )}

         {/* Unused rules warning */}
         {rules.length > ruleMatches.length && (
           <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
             <div className="flex items-center gap-2 text-sm text-yellow-800">
               <AlertCircle size={16} />
               <span className="font-medium">
                 {rules.length - ruleMatches.length} unused rule{rules.length - ruleMatches.length !== 1 ? 's' : ''}
               </span>
             </div>
             <div className="text-xs text-yellow-700 mt-1">
               Some rules don't match any nodes in this tree
             </div>
           </div>
         )}
       </div>
     );
   }

   // Helper: Find node by ID in tree
   function findNodeById(node: AltNode, targetId: string): AltNode | null {
     if (node.id === targetId) return node;
     for (const child of node.children) {
       const found = findNodeById(child, targetId);
       if (found) return found;
     }
     return null;
   }
   ```

2. Test inspector:
   - Select node in tree → inspector shows matched rules
   - Verify priority order (highest first)
   - Verify conflict highlighting (yellow minor, red major)
   - Verify coverage stats (✓ Covered or ✗ Not Covered)

**Files**: `components/applied-rules-inspector.tsx`

**Parallel?**: Yes (can develop concurrently with T090, T092-T096)

**Notes**:
- evaluateRules() from WP05 rule engine
- Coverage stats: shows if node has any rules matched
- Matched rules ordered by priority (descending)
- Contributed properties: green checkmarks
- Conflicted properties: red, shows "lost to higher priority"
- Conflict severity: major (red) vs minor (yellow) badges
- Unused rules warning: shows count of rules not matching this tree
- Success Criteria SC-008: Inspector clarity allows understanding conflicts without external docs

---

### Subtask T092 – Implement tree node click handler: update Applied Rules Inspector

**Purpose**: Wire tree click to inspector update (already implemented in T087/T090/T091).

**Steps**:
1. Verify click handler in T087:
   ```typescript
   <FigmaTreeView
     altNode={altNode}
     selectedNodeId={selectedTreeNodeId}
     onNodeClick={(id) => setSelectedTreeNodeId(id)} // Updates state
   />

   <AppliedRulesInspector
     altNode={altNode}
     selectedNodeId={selectedTreeNodeId} // Re-renders with new selection
     rules={rules}
   />
   ```

2. Test performance: tree click → inspector updates <200ms (Success Criteria SC-006)

**Files**: `app/viewer/[nodeId]/page.tsx`

**Parallel?**: No (integration step)

**Notes**:
- selectedTreeNodeId state managed in parent component
- onNodeClick updates state, triggers inspector re-render
- React re-render should be <100ms (inspector calculates evaluateRules())
- Success Criteria SC-006: Tree click → inspector update <200ms

---

### Subtask T093 – Create components/preview-tabs.tsx for Render tab with format switcher

**Purpose**: Render tab with format selector (React JSX, React+Tailwind, HTML/CSS) and code preview.

**Steps**:
1. Create `components/preview-tabs.tsx`:
   ```typescript
   import { useState } from 'react';
   import { AltNode } from '@/lib/types/altnode';
   import { MappingRule } from '@/lib/types/rule';
   import { generateReactJSX } from '@/lib/code-generators/react';
   import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
   import { generateHTMLCSS } from '@/lib/code-generators/html-css';
   import CodePreview from './code-preview';

   interface PreviewTabsProps {
     altNode: AltNode | null;
     rules: MappingRule[];
   }

   export default function PreviewTabs({ altNode, rules }: PreviewTabsProps) {
     const [format, setFormat] = useState<'react-jsx' | 'react-tailwind' | 'html-css'>('react-jsx');

     if (!altNode) {
       return (
         <div className="p-4 text-gray-500">
           Loading preview...
         </div>
       );
     }

     // Generate code based on selected format
     let generatedCode = '';
     switch (format) {
       case 'react-jsx':
         generatedCode = generateReactJSX(altNode, {}).code;
         break;
       case 'react-tailwind':
         generatedCode = generateReactTailwind(altNode, {}).code;
         break;
       case 'html-css':
         generatedCode = generateHTMLCSS(altNode, {}).code;
         break;
     }

     return (
       <div className="flex flex-col h-full">
         {/* Format switcher */}
         <div className="border-b border-gray-200 p-4">
           <div className="flex items-center gap-2">
             <span className="text-sm font-medium text-gray-600">Format:</span>
             <button
               onClick={() => setFormat('react-jsx')}
               className={`px-4 py-2 rounded-lg text-sm ${
                 format === 'react-jsx' ? 'bg-blue-500 text-white' : 'bg-gray-200'
               }`}
             >
               React JSX
             </button>
             <button
               onClick={() => setFormat('react-tailwind')}
               className={`px-4 py-2 rounded-lg text-sm ${
                 format === 'react-tailwind' ? 'bg-blue-500 text-white' : 'bg-gray-200'
               }`}
             >
               React + Tailwind
             </button>
             <button
               onClick={() => setFormat('html-css')}
               className={`px-4 py-2 rounded-lg text-sm ${
                 format === 'html-css' ? 'bg-blue-500 text-white' : 'bg-gray-200'
               }`}
             >
               HTML/CSS
             </button>
           </div>
         </div>

         {/* Code preview */}
         <div className="flex-1 overflow-auto">
           <CodePreview code={generatedCode} language="tsx" />
         </div>
       </div>
     );
   }
   ```

2. Test format switcher:
   - Click "React JSX" → preview shows JSX
   - Click "React + Tailwind" → preview shows Tailwind
   - Click "HTML/CSS" → preview shows HTML + CSS

**Files**: `components/preview-tabs.tsx`

**Parallel?**: Yes (can develop concurrently with T090-T091, T094-T096)

**Notes**:
- Format selector: 3 buttons (React JSX, React+Tailwind, HTML/CSS)
- generateReactJSX(), generateReactTailwind(), generateHTMLCSS() from WP06
- CodePreview component (T094) handles syntax highlighting
- Success Criteria SC-007: Format switch → preview update <500ms

---

### Subtask T094 – Create components/code-preview.tsx with syntax highlighting

**Purpose**: Code preview component with Prism.js syntax highlighting.

**Steps**:
1. Create `components/code-preview.tsx`:
   ```typescript
   import { useEffect, useRef } from 'react';
   import Prism from 'prismjs';
   import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
   import 'prismjs/components/prism-jsx';
   import 'prismjs/components/prism-tsx';
   import 'prismjs/components/prism-css';

   interface CodePreviewProps {
     code: string;
     language: 'tsx' | 'jsx' | 'css' | 'html';
   }

   export default function CodePreview({ code, language }: CodePreviewProps) {
     const codeRef = useRef<HTMLElement>(null);

     useEffect(() => {
       if (codeRef.current) {
         Prism.highlightElement(codeRef.current);
       }
     }, [code, language]);

     return (
       <div className="bg-gray-900 p-6 rounded-lg overflow-auto">
         <pre className="text-sm">
           <code ref={codeRef} className={`language-${language}`}>
             {code}
           </code>
         </pre>
       </div>
     );
   }
   ```

2. Test syntax highlighting:
   - Verify JSX keywords highlighted (function, export, return)
   - Verify CSS properties highlighted
   - Verify dark theme applied

**Files**: `components/code-preview.tsx`

**Parallel?**: Yes (can develop concurrently with T090-T093, T095-T096)

**Notes**:
- Prism.js for syntax highlighting (installed in WP06 T055)
- Theme: prism-tomorrow.css (dark theme)
- Languages: tsx, jsx, css, html
- useEffect re-highlights on code/language change
- overflow-auto: scrollable for long code

---

### Subtask T095 – Wire code generators: call react.ts, react-tailwind.ts, html-css.ts based on selected format

**Purpose**: Integration with WP06 code generators (already implemented in T093).

**Steps**:
1. Verify code generation in T093:
   ```typescript
   switch (format) {
     case 'react-jsx':
       generatedCode = generateReactJSX(altNode, resolvedProperties).code;
       break;
     case 'react-tailwind':
       generatedCode = generateReactTailwind(altNode, resolvedProperties).code;
       break;
     case 'html-css':
       generatedCode = generateHTMLCSS(altNode, resolvedProperties).code;
       break;
   }
   ```

2. Test with sample AltNode:
   - Verify React JSX output: `export function Component() { return <div>...</div>; }`
   - Verify React+Tailwind output: `className="flex p-4 ..."`
   - Verify HTML/CSS output: separate HTML + CSS

**Files**: `components/preview-tabs.tsx`

**Parallel?**: No (integration step)

**Notes**:
- resolvedProperties: TODO - need to apply rule engine to get merged properties
- For MVP: pass empty object {}, generators use node.styles directly
- Full integration: evaluateRules() → merge contributedProperties → pass to generators

---

### Subtask T096 – Add export dropdown: copy-to-clipboard, download code file

**Purpose**: Export actions in header dropdown (already in T088, implement logic here).

**Steps**:
1. Implement export actions in T088 header:
   ```typescript
   import { Copy, Download } from 'lucide-react';

   {/* Export dropdown */}
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <button className="p-2 rounded-lg hover:bg-gray-100">
         <Download size={20} />
       </button>
     </DropdownMenuTrigger>
     <DropdownMenuContent>
       <DropdownMenuItem
         onClick={() => {
           // Get generated code from current format
           const code = generatedCode; // Access from state
           navigator.clipboard.writeText(code);
           // TODO: Show success toast
           console.log('Code copied to clipboard');
         }}
       >
         <Copy size={16} className="mr-2" />
         Copy to Clipboard
       </DropdownMenuItem>
       <DropdownMenuItem
         onClick={() => {
           // Get generated code from current format
           const code = generatedCode;
           const filename = `${currentNode.name}.${format === 'html-css' ? 'html' : 'tsx'}`;

           // Create download link
           const blob = new Blob([code], { type: 'text/plain' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = filename;
           a.click();
           URL.revokeObjectURL(url);

           // TODO: Show success toast
           console.log(`Downloaded ${filename}`);
         }}
       >
         <Download size={16} className="mr-2" />
         Download Code File
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
   ```

2. Test export:
   - Copy to clipboard → verify code copied (paste in editor)
   - Download → verify file downloaded with correct name

**Files**: `app/viewer/[nodeId]/page.tsx`

**Parallel?**: Yes (can develop concurrently with T090-T095)

**Notes**:
- Copy: navigator.clipboard.writeText()
- Download: Blob → URL.createObjectURL → trigger download
- Filename: `{nodeName}.{extension}` (tsx for React, html for HTML/CSS)
- TODO: Show success toast (will be implemented with toast library)

---

### Subtask T097 – Test Viewer flow: click node in library → Viewer opens, click tree node → inspector updates, switch formats → preview re-renders

**Purpose**: End-to-end validation of Viewer page functionality.

**Steps**:
1. Create E2E test `__tests__/e2e/viewer-page.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Viewer Page', () => {
     test('should open Viewer from Library', async ({ page }) => {
       await page.goto('/nodes');

       // Click first node card
       await page.click('a[href^="/viewer/"]');

       // Verify Viewer page loaded
       await expect(page).toHaveURL(/\/viewer\/.+/);
       await expect(page.getByText('Code')).toBeVisible();
       await expect(page.getByText('Render')).toBeVisible();
     });

     test('should display Figma tree and inspector', async ({ page }) => {
       await page.goto('/viewer/node-123'); // Replace with valid node ID

       // Verify Code tab active
       await expect(page.getByText('Figma Tree')).toBeVisible();
       await expect(page.getByText('Applied Rules')).toBeVisible();
     });

     test('should update inspector on tree node click', async ({ page }) => {
       await page.goto('/viewer/node-123');

       // Click tree node
       await page.click('text=Button'); // Replace with actual node name

       // Verify inspector updates (check for rule matches)
       await expect(page.getByText('Matched rules')).toBeVisible();
     });

     test('should switch between formats in Render tab', async ({ page }) => {
       await page.goto('/viewer/node-123');

       // Switch to Render tab
       await page.click('button:has-text("Render")');

       // Verify React JSX selected by default
       await expect(page.locator('button:has-text("React JSX")').first()).toHaveClass(/bg-blue-500/);

       // Click React + Tailwind
       await page.click('button:has-text("React + Tailwind")');

       // Verify preview updates (check for className)
       await expect(page.locator('code').first()).toContainText('className');
     });

     test('should navigate between nodes with prev/next', async ({ page }) => {
       await page.goto('/viewer/node-123');

       // Click next button
       await page.click('button:has(svg)'); // Chevron icon

       // Verify URL changed
       await expect(page).toHaveURL(/\/viewer\/node-.+/);
     });
   });
   ```

2. Run E2E tests

3. Manual testing checklist:
   - [ ] Click node in library → Viewer opens with Code tab
   - [ ] Figma tree displays hierarchy
   - [ ] Click tree node → inspector updates <200ms (SC-006)
   - [ ] Inspector shows matched rules, conflicts, coverage
   - [ ] Switch to Render tab → preview shows React JSX
   - [ ] Switch format to Tailwind → preview updates <500ms (SC-007)
   - [ ] Copy to clipboard → code copied
   - [ ] Download file → file downloaded
   - [ ] Prev/next navigation works
   - [ ] "Edit Rules" → navigate to /rules

**Files**: `__tests__/e2e/viewer-page.spec.ts`

**Parallel?**: No (requires all components complete)

**Notes**:
- E2E tests validate complete Viewer workflow
- Performance tests for SC-006, SC-007 (tree click <200ms, format switch <500ms)
- Manual testing complements E2E for UI/UX validation

---

### Subtask T098 – Verify Success Criteria SC-006: Tree click → Applied Rules Inspector update within 200ms

**Purpose**: Validate tree click performance.

**Steps**:
1. Performance test:
   ```typescript
   test('should update inspector within 200ms (SC-006)', async ({ page }) => {
     await page.goto('/viewer/node-123');

     const startTime = Date.now();
     await page.click('text=Button'); // Tree node
     await page.waitForSelector('text=Matched rules');
     const duration = Date.now() - startTime;

     expect(duration).toBeLessThan(200); // Success Criteria SC-006
     console.log(`Inspector updated in ${duration}ms`);
   });
   ```

2. Verify performance: evaluateRules() should be <50ms (50 rules × 1 node)

**Files**: `__tests__/e2e/viewer-page.spec.ts`

**Parallel?**: No (performance validation)

**Notes**:
- Success Criteria SC-006: Tree click → inspector update <200ms
- evaluateRules() from WP05 benchmarked at <2s for 50 rules × 100 nodes
- Single node evaluation should be <50ms
- React re-render overhead: ~50-100ms
- Total: <200ms

---

### Subtask T099 – Verify Success Criteria SC-007: Format switch → preview update within 500ms

**Purpose**: Validate format switch performance.

**Steps**:
1. Performance test:
   ```typescript
   test('should update preview within 500ms (SC-007)', async ({ page }) => {
     await page.goto('/viewer/node-123');
     await page.click('button:has-text("Render")');

     const startTime = Date.now();
     await page.click('button:has-text("React + Tailwind")');
     await page.waitForSelector('code:has-text("className")');
     const duration = Date.now() - startTime;

     expect(duration).toBeLessThan(500); // Success Criteria SC-007
     console.log(`Preview updated in ${duration}ms`);
   });
   ```

2. Verify performance: code generation should be <100ms

**Files**: `__tests__/e2e/viewer-page.spec.ts`

**Parallel?**: No (performance validation)

**Notes**:
- Success Criteria SC-007: Format switch → preview update <500ms
- Code generation (WP06) template-based, should be <100ms
- Prism.js syntax highlighting: ~100-200ms
- React re-render: ~50-100ms
- Total: <500ms

## Definition of Done Checklist

- [ ] `app/viewer/[nodeId]/page.tsx` created with Code/Render tabs
- [ ] Header with thumbnail, name, prev/next nav, re-fetch, export, "Edit Rules"
- [ ] Breadcrumbs: Home > Library > NodeName
- [ ] `components/figma-tree-view.tsx` with hierarchical tree display
- [ ] `components/applied-rules-inspector.tsx` with matched rules, conflicts, coverage
- [ ] Tree click handler updates inspector (<200ms - SC-006)
- [ ] `components/preview-tabs.tsx` with format switcher
- [ ] `components/code-preview.tsx` with Prism.js syntax highlighting
- [ ] Code generators wired: React JSX, React+Tailwind, HTML/CSS
- [ ] Export dropdown: copy to clipboard, download file
- [ ] E2E tests written and passing (viewer-page.spec.ts)
- [ ] Success Criteria SC-006 verified: Tree click <200ms
- [ ] Success Criteria SC-007 verified: Format switch <500ms
- [ ] Success Criteria SC-008 verified: Inspector clarity without external docs
- [ ] User Story 4 (Viewer) fully implemented
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. Code tab: ResizablePanels with tree (40%) + inspector (60%)
2. Tree view: hierarchical, collapsible, indented, selectable
3. Inspector: matched rules by priority, property provenance, conflicts highlighted
4. Render tab: full-width preview with format switcher
5. Format switch: updates preview with selected framework (React/Tailwind/HTML)
6. Export: copy to clipboard + download file
7. Performance: tree click <200ms, format switch <500ms (SC-006, SC-007)

**Reviewers should verify**:
- No `any` types in components (TypeScript strict mode)
- Tree view recursion handles deep nesting (10+ levels)
- Inspector evaluateRules() called only when selectedNodeId changes (performance)
- Conflict severity correctly classified: major (red) vs minor (yellow)
- Code preview syntax highlighting works for all formats (tsx, jsx, css, html)
- Prev/next navigation disabled correctly (first/last node)
- Export filename correct: `{nodeName}.tsx` or `{nodeName}.html`

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
