---
work_package_id: "WP11"
subtasks:
  - "T100"
  - "T101"
  - "T102"
  - "T103"
  - "T104"
  - "T105"
  - "T106"
  - "T107"
  - "T108"
  - "T109"
  - "T110"
  - "T111"
  - "T112"
  - "T113"
title: "Rule Manager Page"
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

# Work Package Prompt: WP11 – Rule Manager Page

## Objectives & Success Criteria

Build Rule Manager page (`app/rules/page.tsx`) with searchable rule list sidebar, Monaco Editor modal for JSON editing, import/export functionality, and real-time match count badges. This is the core rule authoring and management interface.

**Success Criteria**:
- Sidebar: Searchable rule list with name, priority, match count badges, unused warning (0 matches)
- Main panel: Selected rule details (ID, name, priority editable, selector/transformer preview, match count, actions)
- Monaco Editor: JSON editing with schema validation and autocomplete
- New Rule: Opens Monaco with template JSON
- Edit/Duplicate/Delete: Full CRUD operations on rules
- Import/Export: Upload JSON file, download mapping-rules.json
- Match counts: Calculate across all nodes in library, update within 2 seconds (SC-005)
- Success Criteria SC-009: Export → re-import → no data loss
- Success Criteria SC-014: Match counts 100% accurate
- User Story 5 (Rule Management) fully implemented

## Context & Constraints

**Architecture**: Rule Manager is the rule authoring interface (Constitution Principle IX: Separation - editing separate from viewing). Monaco Editor provides professional JSON editing experience with validation.

**Key Decisions from Planning**:
- Sidebar: List from Zustand rules-store, search filters by name/ID
- Match count badges: Run rule engine against all nodes (use-rule-matches.ts hook)
- Monaco Editor: Dynamic import to reduce bundle size, JSON language server with schema validation
- Import: Validate schema, merge with conflict resolution
- Export: Complete mapping-rules.json with version metadata

**Constitutional Principles**:
- Principle IV: Rule Portability – JSON-only, no code/DSL
- Principle V: Type Safety – Schema validation in Monaco
- Principle VII: Live Feedback – Match counts update <2s (SC-005)

**Related Documents**:
- [spec.md](../spec.md) – User Story 5 (Rule Manager requirements)
- [plan.md](../plan.md) – Rule Manager architecture
- [contracts/rule-schema.json](../contracts/rule-schema.json) – JSON schema for validation
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T100 – Create app/rules/page.tsx with sidebar + main panel layout

**Purpose**: Establish Rule Manager page with sidebar list and main detail panel.

**Steps**:
1. Create `app/rules/page.tsx`:
   ```typescript
   'use client';

   import { useEffect, useState } from 'react';
   import { useRulesStore, useNodesStore } from '@/lib/store';
   import { Search, Plus, Upload, Download } from 'lucide-react';
   import RuleEditor from '@/components/rule-editor';

   export default function RuleManagerPage() {
     const rules = useRulesStore(state => state.rules);
     const selectedRuleId = useRulesStore(state => state.selectedRuleId);
     const selectRule = useRulesStore(state => state.selectRule);
     const loadRules = useRulesStore(state => state.loadRules);
     const deleteRule = useRulesStore(state => state.deleteRule);
     const duplicateRule = useRulesStore(state => state.duplicateRule);
     const exportRules = useRulesStore(state => state.exportRules);

     const [searchTerm, setSearchTerm] = useState('');
     const [showEditor, setShowEditor] = useState(false);
     const [editorMode, setEditorMode] = useState<'new' | 'edit'>('new');

     useEffect(() => {
       loadRules();
     }, [loadRules]);

     // Filter rules by search
     const filteredRules = rules.filter(rule =>
       rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       rule.id.toLowerCase().includes(searchTerm.toLowerCase())
     );

     const selectedRule = rules.find(r => r.id === selectedRuleId);

     return (
       <div className="h-screen flex">
         {/* Sidebar: Rule list (T101) */}
         <div className="w-80 border-r border-gray-200 flex flex-col">
           {/* Top actions */}
           <div className="p-4 border-b border-gray-200">
             <div className="flex gap-2 mb-4">
               <button
                 onClick={() => {
                   setEditorMode('new');
                   setShowEditor(true);
                 }}
                 className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
               >
                 <Plus size={16} />
                 New Rule
               </button>
             </div>

             <div className="flex gap-2">
               <button
                 onClick={() => {/* Import (T109) */}}
                 className="flex-1 px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 text-sm"
               >
                 <Upload size={14} />
                 Import
               </button>
               <button
                 onClick={() => {
                   const json = exportRules();
                   const blob = new Blob([json], { type: 'application/json' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = 'mapping-rules.json';
                   a.click();
                   URL.revokeObjectURL(url);
                 }}
                 className="flex-1 px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 text-sm"
               >
                 <Download size={14} />
                 Export
               </button>
             </div>
           </div>

           {/* Search */}
           <div className="p-4 border-b border-gray-200">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
               <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search rules..."
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
               />
             </div>
           </div>

           {/* Rule list */}
           <div className="flex-1 overflow-auto">
             {filteredRules.map(rule => (
               <div
                 key={rule.id}
                 onClick={() => selectRule(rule.id)}
                 className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                   selectedRuleId === rule.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                 }`}
               >
                 <div className="flex items-start justify-between mb-1">
                   <h3 className="font-semibold text-sm truncate flex-1">{rule.name}</h3>
                   {/* Match count badge (T110) */}
                 </div>
                 <div className="text-xs text-gray-500">
                   Priority: {rule.priority} • ID: {rule.id.slice(0, 8)}
                 </div>
               </div>
             ))}

             {filteredRules.length === 0 && (
               <div className="p-4 text-center text-gray-500 text-sm">
                 {searchTerm ? 'No matching rules' : 'No rules created yet'}
               </div>
             )}
           </div>
         </div>

         {/* Main panel: Selected rule details (T102) */}
         <div className="flex-1 overflow-auto">
           {selectedRule ? (
             <div className="p-8">
               {/* Rule details */}
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-gray-500">
               Select a rule to view details
             </div>
           )}
         </div>

         {/* Monaco Editor Modal (T103-T106) */}
         {showEditor && (
           <RuleEditor
             mode={editorMode}
             ruleId={editorMode === 'edit' ? selectedRuleId : undefined}
             onClose={() => setShowEditor(false)}
           />
         )}
       </div>
     );
   }
   ```

2. Verify page renders with sidebar + main panel

**Files**: `app/rules/page.tsx`

**Parallel?**: No (entry point)

**Notes**:
- Sidebar: 320px width (w-80), scrollable rule list
- Main panel: flex-1, details for selected rule
- Top actions: New Rule, Import, Export buttons
- Search: filters rules by name or ID (case-insensitive)
- Selected rule: blue background, blue left border

---

### Subtask T101 – Create rule list sidebar: searchable, shows name, priority, match count badge, unused warning

**Purpose**: Rule list component with match count badges (already in T100, add match counts here).

**Steps**:
1. Add match count badge using use-rule-matches hook (T110):
   ```typescript
   import { useRuleMatches } from '@/hooks/use-rule-matches';

   function RuleListItem({ rule }: { rule: MappingRule }) {
     const matchCount = useRuleMatches(rule.id);

     return (
       <div className="...">
         <div className="flex items-start justify-between mb-1">
           <h3 className="font-semibold text-sm truncate flex-1">{rule.name}</h3>

           {/* Match count badge */}
           <span
             className={`px-2 py-0.5 rounded-full text-xs font-medium ${
               matchCount === 0
                 ? 'bg-yellow-100 text-yellow-800'
                 : 'bg-green-100 text-green-800'
             }`}
           >
             {matchCount}
           </span>
         </div>

         {/* Unused warning */}
         {matchCount === 0 && (
           <div className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
             ⚠️ Unused
           </div>
         )}
       </div>
     );
   }
   ```

2. Test match count badges:
   - Create rule that matches nodes → badge shows count (green)
   - Create rule that matches nothing → badge shows 0 (yellow) + "⚠️ Unused"

**Files**: `app/rules/page.tsx`

**Parallel?**: No (depends on T110 hook)

**Notes**:
- Match count: green badge if >0, yellow if 0
- Unused warning: shows "⚠️ Unused" for 0 matches
- use-rule-matches hook (T110) calculates counts across all nodes

---

### Subtask T102 – Create main panel: selected rule details

**Purpose**: Main panel displaying selected rule with editable fields and actions.

**Steps**:
1. Add main panel content to T100:
   ```typescript
   {selectedRule && (
     <div className="p-8">
       <div className="mb-6">
         <h1 className="text-2xl font-bold mb-2">{selectedRule.name}</h1>
         <div className="text-sm text-gray-500">
           ID: {selectedRule.id} • Priority: {selectedRule.priority}
         </div>
       </div>

       {/* Editable fields */}
       <div className="space-y-4 mb-6">
         <div>
           <label className="block text-sm font-medium mb-2">Name</label>
           <input
             type="text"
             value={selectedRule.name}
             onChange={(e) => useRulesStore.getState().updateRule(selectedRule.id, { name: e.target.value })}
             className="w-full px-4 py-2 border border-gray-300 rounded-lg"
           />
         </div>

         <div>
           <label className="block text-sm font-medium mb-2">Priority</label>
           <input
             type="number"
             value={selectedRule.priority}
             onChange={(e) => useRulesStore.getState().updateRule(selectedRule.id, { priority: parseInt(e.target.value) })}
             className="w-full px-4 py-2 border border-gray-300 rounded-lg"
           />
         </div>
       </div>

       {/* Selector preview */}
       <div className="mb-6">
         <h3 className="text-sm font-semibold mb-2">Selector</h3>
         <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
           {JSON.stringify(selectedRule.selector, null, 2)}
         </pre>
       </div>

       {/* Transformer preview */}
       <div className="mb-6">
         <h3 className="text-sm font-semibold mb-2">Transformer</h3>
         <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
           {JSON.stringify(selectedRule.transformer, null, 2)}
         </pre>
       </div>

       {/* Match count */}
       <div className="mb-6">
         <h3 className="text-sm font-semibold mb-2">Match Count</h3>
         <div className="text-2xl font-bold">
           {useRuleMatches(selectedRule.id)} nodes
         </div>
       </div>

       {/* Actions */}
       <div className="flex gap-2">
         <button
           onClick={() => {
             setEditorMode('edit');
             setShowEditor(true);
           }}
           className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
         >
           Edit JSON
         </button>
         <button
           onClick={() => duplicateRule(selectedRule.id)}
           className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
         >
           Duplicate
         </button>
         <button
           onClick={() => {
             if (confirm(`Delete rule "${selectedRule.name}"?`)) {
               deleteRule(selectedRule.id);
               selectRule(null);
             }
           }}
           className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
         >
           Delete
         </button>
       </div>
     </div>
   )}
   ```

2. Test main panel:
   - Select rule → details show
   - Edit name/priority → updates immediately
   - Selector/transformer previews show JSON
   - Match count displays

**Files**: `app/rules/page.tsx`

**Parallel?**: Yes (can develop concurrently with T103-T110)

**Notes**:
- Editable fields: name (text input), priority (number input)
- Selector/transformer: read-only JSON preview (edit via Monaco)
- Match count: live from use-rule-matches hook
- Actions: Edit JSON, Duplicate, Delete buttons
- Delete: confirmation dialog

---

### Subtask T103 – Create components/rule-editor.tsx wrapping Monaco Editor

**Purpose**: Monaco Editor modal for JSON editing.

**Steps**:
1. Create `components/rule-editor.tsx`:
   ```typescript
   'use client';

   import { useState, useEffect } from 'react';
   import dynamic from 'next/dynamic';
   import { useRulesStore } from '@/lib/store';
   import { MappingRule } from '@/lib/types/rule';
   import { X } from 'lucide-react';

   // Dynamic import Monaco Editor (reduce bundle size)
   const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

   interface RuleEditorProps {
     mode: 'new' | 'edit';
     ruleId?: string;
     onClose: () => void;
   }

   export default function RuleEditor({ mode, ruleId, onClose }: RuleEditorProps) {
     const rules = useRulesStore(state => state.rules);
     const createRule = useRulesStore(state => state.createRule);
     const updateRule = useRulesStore(state => state.updateRule);

     const existingRule = mode === 'edit' && ruleId ? rules.find(r => r.id === ruleId) : null;

     // Template for new rule
     const templateRule: MappingRule = {
       id: `rule-${Date.now()}`,
       name: 'New Rule',
       priority: 10,
       selector: {
         type: 'FRAME',
       },
       transformer: {
         backgroundColor: '#FFFFFF',
       },
     };

     const [jsonValue, setJsonValue] = useState(
       JSON.stringify(existingRule || templateRule, null, 2)
     );
     const [error, setError] = useState('');

     const handleSave = () => {
       try {
         const rule: MappingRule = JSON.parse(jsonValue);

         // Basic validation
         if (!rule.id || !rule.name || rule.priority === undefined) {
           throw new Error('Missing required fields: id, name, priority');
         }

         if (mode === 'new') {
           createRule(rule);
         } else if (mode === 'edit' && ruleId) {
           updateRule(ruleId, rule);
         }

         onClose();
       } catch (err: any) {
         setError(err.message || 'Invalid JSON');
       }
     };

     return (
       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
           {/* Header */}
           <div className="flex items-center justify-between p-4 border-b border-gray-200">
             <h2 className="text-xl font-bold">
               {mode === 'new' ? 'New Rule' : 'Edit Rule'}
             </h2>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
               <X size={20} />
             </button>
           </div>

           {/* Monaco Editor */}
           <div className="flex-1 overflow-hidden">
             <MonacoEditor
               height="100%"
               language="json"
               value={jsonValue}
               onChange={(value) => setJsonValue(value || '')}
               options={{
                 minimap: { enabled: false },
                 fontSize: 14,
                 lineNumbers: 'on',
                 scrollBeyondLastLine: false,
                 automaticLayout: true,
               }}
               theme="vs-dark"
             />
           </div>

           {/* Footer */}
           <div className="p-4 border-t border-gray-200 flex items-center justify-between">
             {error && (
               <div className="text-sm text-red-600">{error}</div>
             )}
             <div className="ml-auto flex gap-2">
               <button
                 onClick={onClose}
                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
               >
                 Cancel
               </button>
               <button
                 onClick={handleSave}
                 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
               >
                 Save
               </button>
             </div>
           </div>
         </div>
       </div>
     );
   }
   ```

2. Test editor:
   - New Rule → template JSON loads
   - Edit Rule → existing rule JSON loads
   - Edit JSON → syntax highlighting works
   - Save → rule created/updated
   - Invalid JSON → error message shows

**Files**: `components/rule-editor.tsx`

**Parallel?**: Yes (can develop concurrently with T100-T102, T104-T110)

**Notes**:
- Monaco Editor: dynamic import (reduces bundle size)
- Template rule: basic structure for new rules
- JSON validation: try/catch on save, shows error message
- Modal: fixed overlay (z-50), 90% viewport width/height
- Theme: vs-dark (matches code preview)

---

### Subtask T104 – Configure Monaco with contracts/rule-schema.json for validation and autocomplete

**Purpose**: JSON schema validation and autocomplete in Monaco Editor.

**Steps**:
1. Add schema configuration to RuleEditor:
   ```typescript
   import { useEffect } from 'react';

   // Inside RuleEditor component
   useEffect(() => {
     // Configure Monaco JSON language service
     if (typeof window !== 'undefined' && window.monaco) {
       const monaco = window.monaco;

       monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
         validate: true,
         schemas: [
           {
             uri: 'http://myapp.com/rule-schema.json',
             fileMatch: ['*'],
             schema: {
               type: 'object',
               required: ['id', 'name', 'priority', 'selector', 'transformer'],
               properties: {
                 id: { type: 'string' },
                 name: { type: 'string' },
                 priority: { type: 'number' },
                 selector: {
                   type: 'object',
                   properties: {
                     type: { type: 'string', enum: ['FRAME', 'TEXT', 'RECTANGLE', 'GROUP', 'COMPONENT'] },
                     name: { type: 'string' },
                     width: {
                       type: 'object',
                       properties: {
                         min: { type: 'number' },
                         max: { type: 'number' },
                       },
                     },
                     height: {
                       type: 'object',
                       properties: {
                         min: { type: 'number' },
                         max: { type: 'number' },
                       },
                     },
                   },
                 },
                 transformer: {
                   type: 'object',
                   additionalProperties: { type: 'string' },
                 },
               },
             },
           },
         ],
       });
     }
   }, []);
   ```

2. Test schema validation:
   - Type invalid JSON → red squiggly underline
   - Missing required field → error message
   - Autocomplete: type "s" → suggests "selector"
   - Enum validation: type "type": → suggests FRAME, TEXT, etc.

**Files**: `components/rule-editor.tsx`

**Parallel?**: No (extends T103)

**Notes**:
- JSON schema from contracts/rule-schema.json (should be created separately)
- Monaco language service: validate + autocomplete
- Schema validation: required fields, enum values, property types
- Autocomplete: triggered by typing, shows suggestions

---

### Subtask T105 – Implement "New Rule" button: open Monaco with template rule JSON

**Purpose**: New Rule button opens Monaco with template (already in T100/T103).

**Steps**:
1. Verify "New Rule" button in T100:
   ```typescript
   <button
     onClick={() => {
       setEditorMode('new');
       setShowEditor(true);
     }}
     className="..."
   >
     <Plus size={16} />
     New Rule
   </button>
   ```

2. Verify template in T103 RuleEditor

3. Test flow:
   - Click "New Rule" → Monaco opens with template
   - Edit JSON → change name, selector, transformer
   - Save → new rule appears in sidebar

**Files**: `app/rules/page.tsx`, `components/rule-editor.tsx`

**Parallel?**: No (validation step)

**Notes**:
- Template rule provides starting point for new rules
- Default priority: 10 (can be changed)
- Default selector: `{ type: 'FRAME' }` (matches all FRAME nodes)
- Default transformer: `{ backgroundColor: '#FFFFFF' }` (simple property)

---

### Subtask T106 – Implement "Edit JSON" button: open Monaco with selected rule, save updates

**Purpose**: Edit JSON button opens Monaco with existing rule (already in T102).

**Steps**:
1. Verify "Edit JSON" button in T102
2. Test flow:
   - Select rule → click "Edit JSON" → Monaco opens with rule JSON
   - Modify selector/transformer → Save
   - Verify rule updated in sidebar + main panel

**Files**: `app/rules/page.tsx`, `components/rule-editor.tsx`

**Parallel?**: No (validation step)

**Notes**:
- Edit mode: loads existing rule JSON
- updateRule() action updates in rules-store
- Match counts recalculate after save (T110 hook re-runs)

---

### Subtask T107 – Implement "Duplicate" action

**Purpose**: Duplicate rule with new ID and priority (already in T102).

**Steps**:
1. Verify duplicateRule() in rules-store (WP07):
   ```typescript
   duplicateRule: (ruleId: string) => {
     const originalRule = get().rules.find(r => r.id === ruleId);
     if (!originalRule) return;

     const duplicatedRule: MappingRule = {
       ...originalRule,
       id: `${originalRule.id}-copy-${Date.now()}`,
       name: `${originalRule.name} (Copy)`,
       priority: originalRule.priority - 1, // Lower priority
     };

     set((state) => ({
       rules: [...state.rules, duplicatedRule],
     }));
   }
   ```

2. Test duplicate:
   - Click "Duplicate" → new rule appears in sidebar
   - Verify name has " (Copy)" suffix
   - Verify priority decreased by 1
   - Verify selector/transformer identical

**Files**: `app/rules/page.tsx`, `lib/store/rules-store.ts`

**Parallel?**: No (validation step)

**Notes**:
- Duplicate creates new rule with unique ID
- Priority decremented to place below original
- Name appended with " (Copy)"
- Useful for creating variations of rules

---

### Subtask T108 – Implement "Delete" action: confirmation dialog, remove from rules-store

**Purpose**: Delete rule with confirmation (already in T102).

**Steps**:
1. Verify delete logic in T102:
   ```typescript
   <button
     onClick={() => {
       if (confirm(`Delete rule "${selectedRule.name}"?`)) {
         deleteRule(selectedRule.id);
         selectRule(null);
       }
     }}
     className="..."
   >
     Delete
   </button>
   ```

2. Test delete:
   - Click "Delete" → confirmation dialog shows
   - Cancel → rule not deleted
   - Confirm → rule removed from sidebar, selection cleared

**Files**: `app/rules/page.tsx`

**Parallel?**: No (validation step)

**Notes**:
- Confirmation dialog: native confirm() for MVP
- deleteRule() removes from rules-store (WP07)
- saveRules() auto-saves to filesystem (WP07)
- Selection cleared after delete (selectRule(null))

---

### Subtask T109 – Add top actions: "Import Rules", "Export Rules"

**Purpose**: Import/export rule library JSON.

**Steps**:
1. Implement Import button (already in T100):
   ```typescript
   <button
     onClick={() => {
       const input = document.createElement('input');
       input.type = 'file';
       input.accept = '.json';
       input.onchange = async (e) => {
         const file = (e.target as HTMLInputElement).files?.[0];
         if (!file) return;

         const text = await file.text();
         try {
           await useRulesStore.getState().importRules(text);
           // TODO: Show success toast
           console.log('Rules imported successfully');
         } catch (err: any) {
           alert(`Import failed: ${err.message}`);
         }
       };
       input.click();
     }}
     className="..."
   >
     <Upload size={14} />
     Import
   </button>
   ```

2. Verify Export button (already in T100)

3. Test import:
   - Click "Import" → file picker opens
   - Select mapping-rules.json → rules imported
   - Duplicate IDs → conflict warning (rules-store logic)
   - Verify rules appear in sidebar

4. Test export:
   - Click "Export" → mapping-rules.json downloads
   - Open file → verify JSON format correct
   - Re-import → no data loss (Success Criteria SC-009)

**Files**: `app/rules/page.tsx`

**Parallel?**: No (validation step)

**Notes**:
- Import: file input dialog, validates JSON, calls importRules()
- Export: downloads JSON file via Blob
- importRules() merges with existing rules (WP07 rules-store)
- Success Criteria SC-009: Export → re-import → no data loss

---

### Subtask T110 – Create hooks/use-rule-matches.ts to calculate match counts

**Purpose**: Custom hook to calculate rule match counts across all nodes.

**Steps**:
1. Create `hooks/use-rule-matches.ts`:
   ```typescript
   import { useMemo } from 'react';
   import { useNodesStore, useRulesStore } from '@/lib/store';
   import { evaluateRules } from '@/lib/rule-engine';
   import { transformToAltNode } from '@/lib/altnode-transform';

   /**
    * Calculate match count for a specific rule across all nodes
    *
    * @param ruleId - Rule ID to calculate matches for
    * @returns Number of nodes matched by this rule
    */
   export function useRuleMatches(ruleId: string): number {
     const nodes = useNodesStore(state => state.nodes);
     const rules = useRulesStore(state => state.rules);

     const matchCount = useMemo(() => {
       const rule = rules.find(r => r.id === ruleId);
       if (!rule) return 0;

       let count = 0;

       for (const nodeMetadata of nodes) {
         // TODO: Load AltNode from cache (WP04 integration)
         // For MVP: skip nodes without cached AltNode
         const altNode = null; // Placeholder

         if (!altNode) continue;

         // Evaluate rule against node
         const matches = evaluateRules(altNode, [rule]);
         if (matches.length > 0) {
           count++;
         }
       }

       return count;
     }, [ruleId, nodes, rules]);

     return matchCount;
   }

   /**
    * Calculate match counts for ALL rules
    *
    * @returns Map of ruleId → match count
    */
   export function useAllRuleMatches(): Map<string, number> {
     const nodes = useNodesStore(state => state.nodes);
     const rules = useRulesStore(state => state.rules);

     const matchCounts = useMemo(() => {
       const counts = new Map<string, number>();

       // Initialize all rules to 0
       for (const rule of rules) {
         counts.set(rule.id, 0);
       }

       // Count matches for each node
       for (const nodeMetadata of nodes) {
         const altNode = null; // Placeholder

         if (!altNode) continue;

         // Evaluate all rules against this node
         const matches = evaluateRules(altNode, rules);

         // Increment count for each matched rule
         for (const match of matches) {
           counts.set(match.ruleId, (counts.get(match.ruleId) || 0) + 1);
         }
       }

       return counts;
     }, [nodes, rules]);

     return matchCounts;
   }
   ```

2. Test hook:
   - Import nodes (5 nodes)
   - Create rule that matches 3 nodes → matchCount = 3
   - Create rule that matches 0 nodes → matchCount = 0
   - Verify updates within 2 seconds (Success Criteria SC-005)

**Files**: `hooks/use-rule-matches.ts`

**Parallel?**: Yes (can develop concurrently with T100-T109)

**Notes**:
- useMemo: recalculates only when nodes or rules change
- evaluateRules() from WP05 rule engine
- Performance: ~2s for 50 rules × 100 nodes (WP05 T049 benchmark)
- Success Criteria SC-005: Match counts update <2s after rule changes
- Success Criteria SC-014: Match counts 100% accurate

---

### Subtask T111 – Test Rule Manager flow: create, edit, duplicate, delete, import, export

**Purpose**: End-to-end validation of Rule Manager functionality.

**Steps**:
1. Create E2E test `__tests__/e2e/rule-manager.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Rule Manager Page', () => {
     test('should display rule list', async ({ page }) => {
       await page.goto('/rules');

       await expect(page.getByText('New Rule')).toBeVisible();
       await expect(page.getByPlaceholder('Search rules...')).toBeVisible();
     });

     test('should create new rule', async ({ page }) => {
       await page.goto('/rules');

       await page.click('button:has-text("New Rule")');
       await expect(page.getByText('New Rule')).toBeVisible(); // Modal title

       // Edit JSON (Monaco Editor loaded)
       await page.waitForSelector('.monaco-editor');

       // Save rule
       await page.click('button:has-text("Save")');

       // Verify rule appears in sidebar
       await expect(page.locator('text=New Rule').first()).toBeVisible();
     });

     test('should edit existing rule', async ({ page }) => {
       await page.goto('/rules');

       // Select rule
       await page.click('text=Button Style'); // Replace with actual rule name

       // Click Edit JSON
       await page.click('button:has-text("Edit JSON")');

       // Modify JSON (simplified - real test would edit in Monaco)
       await page.click('button:has-text("Save")');

       // Verify updated
     });

     test('should export and import rules', async ({ page }) => {
       await page.goto('/rules');

       // Export
       const downloadPromise = page.waitForEvent('download');
       await page.click('button:has-text("Export")');
       const download = await downloadPromise;
       expect(download.suggestedFilename()).toBe('mapping-rules.json');

       // Import (simplified - real test would upload file)
       // Verify rules loaded
     });
   });
   ```

2. Manual testing checklist:
   - [ ] New Rule → Monaco opens with template
   - [ ] Edit JSON → Monaco opens with rule
   - [ ] Save → rule updated in sidebar
   - [ ] Duplicate → new rule with " (Copy)" suffix
   - [ ] Delete → confirmation, rule removed
   - [ ] Import → upload JSON, rules merge
   - [ ] Export → download mapping-rules.json
   - [ ] Match count badges show correct values
   - [ ] Search filters rules by name/ID

**Files**: `__tests__/e2e/rule-manager.spec.ts`

**Parallel?**: No (requires all components complete)

**Notes**:
- E2E tests validate complete rule management workflow
- Monaco Editor testing requires waiting for `.monaco-editor` selector
- Export test: waitForEvent('download') to catch file download

---

### Subtask T112 – Verify Success Criteria SC-005: Create rule → match counts update within 2 seconds

**Purpose**: Validate match count performance.

**Steps**:
1. Performance test:
   ```typescript
   test('should update match counts within 2 seconds (SC-005)', async ({ page }) => {
     await page.goto('/rules');

     // Create new rule
     const startTime = Date.now();
     await page.click('button:has-text("New Rule")');
     await page.click('button:has-text("Save")');

     // Wait for match count badge to update
     await page.waitForSelector('text=0'); // Match count badge
     const duration = Date.now() - startTime;

     expect(duration).toBeLessThan(2000); // Success Criteria SC-005
     console.log(`Match counts updated in ${duration}ms`);
   });
   ```

2. Verify performance: useRuleMatches hook should recalculate <2s

**Files**: `__tests__/e2e/rule-manager.spec.ts`

**Parallel?**: No (performance validation)

**Notes**:
- Success Criteria SC-005: Match counts update <2s
- useRuleMatches() recalculates when rules change (useMemo dependency)
- Benchmark: 50 rules × 100 nodes <2s (WP05 T049)

---

### Subtask T113 – Verify Success Criteria SC-009: Export → re-import → no data loss

**Purpose**: Validate import/export data integrity.

**Steps**:
1. Data integrity test:
   ```typescript
   test('should preserve all data on export/import (SC-009)', async ({ page }) => {
     await page.goto('/rules');

     // Count initial rules
     const initialCount = await page.locator('[data-testid="rule-item"]').count();

     // Export rules
     const downloadPromise = page.waitForEvent('download');
     await page.click('button:has-text("Export")');
     const download = await downloadPromise;
     const path = await download.path();

     // Read exported JSON
     const fs = require('fs');
     const exportedData = JSON.parse(fs.readFileSync(path, 'utf-8'));

     // Verify structure
     expect(exportedData.version).toBe('1.0.0');
     expect(exportedData.rules).toHaveLength(initialCount);

     // Re-import (in fresh project simulation)
     // Verify all rules restored with same properties
   });
   ```

2. Verify no data loss: all rule properties preserved (id, name, priority, selector, transformer)

**Files**: `__tests__/e2e/rule-manager.spec.ts`

**Parallel?**: No (data integrity validation)

**Notes**:
- Success Criteria SC-009: Export → re-import → no data loss
- Exported JSON structure: version, rules array, metadata
- All rule properties must be preserved
- Constitution Principle IV: Rule Portability - JSON-only, no code/DSL

## Definition of Done Checklist

- [ ] `app/rules/page.tsx` created with sidebar + main panel
- [ ] Rule list sidebar: searchable, match count badges, unused warnings
- [ ] Main panel: selected rule details, editable name/priority, actions
- [ ] `components/rule-editor.tsx` with Monaco Editor
- [ ] Monaco configured with JSON schema validation and autocomplete
- [ ] "New Rule" button opens Monaco with template
- [ ] "Edit JSON" button opens Monaco with selected rule
- [ ] "Duplicate" action creates copy with new ID
- [ ] "Delete" action with confirmation dialog
- [ ] Import/Export: upload JSON, download mapping-rules.json
- [ ] `hooks/use-rule-matches.ts` calculates match counts
- [ ] E2E tests written and passing (rule-manager.spec.ts)
- [ ] Success Criteria SC-005 verified: Match counts update <2s
- [ ] Success Criteria SC-009 verified: Export/import no data loss
- [ ] Success Criteria SC-014 verified: Match counts 100% accurate
- [ ] User Story 5 (Rule Management) fully implemented
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. Sidebar: searchable rule list, match count badges (green >0, yellow 0)
2. Main panel: editable name/priority, selector/transformer previews, actions
3. Monaco Editor: JSON editing with schema validation and autocomplete
4. CRUD operations: Create (New Rule), Read (select), Update (Edit JSON), Delete (with confirmation)
5. Duplicate: creates copy with unique ID, decremented priority, " (Copy)" suffix
6. Import/Export: JSON file upload/download, no data loss
7. Match counts: 100% accurate, update <2s (SC-005, SC-014)

**Reviewers should verify**:
- No `any` types in components (TypeScript strict mode)
- Monaco Editor dynamic import (reduces bundle size)
- JSON schema validation works (invalid JSON shows errors)
- Match count calculation correct (evaluateRules() against all nodes)
- Export JSON format matches spec (version, rules array, metadata)
- Import handles duplicate IDs (conflict resolution or merge logic)
- useRuleMatches() hook performance: <2s for 50 rules × 100 nodes

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
