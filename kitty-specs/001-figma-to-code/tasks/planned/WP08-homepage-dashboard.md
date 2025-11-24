---
work_package_id: "WP08"
subtasks:
  - "T067"
  - "T068"
  - "T069"
  - "T070"
  - "T071"
  - "T072"
  - "T073"
  - "T074"
  - "T075"
title: "Homepage Dashboard"
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

# Work Package Prompt: WP08 – Homepage Dashboard

## Objectives & Success Criteria

Build Homepage (`app/page.tsx`) with dashboard stats, recent nodes, rule usage chart, and import field. This is the entry point for users, providing instant insight into library health and quick access to common actions.

**Success Criteria**:
- Stats cards show: total nodes, total rules, avg coverage %, last import date
- Recent nodes section displays 5 most recent imports with thumbnails
- Rule usage chart shows top 5 most-matched rules (bar chart)
- Import field accepts Figma URL, auto-parses, triggers import flow
- Success Criteria SC-012: Stats accurate and update within 1 second of changes
- User Story 3 (Dashboard) fully implemented

## Context & Constraints

**Architecture**: Homepage is dashboard-first design (Constitution Principle I: Developer Experience First). Users see productivity metrics immediately on app launch.

**Key Decisions from Planning**:
- Dashboard stats from `hooks/use-library-stats.ts` (wraps Zustand ui-store.loadStats())
- Import dialog reuses URL parser from WP03 (lib/utils/url-parser.ts)
- Chart library: Recharts or Chart.js for rule usage visualization
- Stats cached with 5-minute TTL (ui-store) to avoid recalculating on every render

**Constitutional Principles**:
- Principle I: Developer Experience First – Dashboard shows stats, graphs, quick import
- Principle VII: Live Feedback – Stats update <1s after import/rule changes (SC-012)
- Principle VI: Simple Before Clever – Basic stats cards + chart, no advanced analytics

**Related Documents**:
- [spec.md](../spec.md) – User Story 3 (Dashboard requirements)
- [plan.md](../plan.md) – Homepage dashboard section
- [data-model.md](../data-model.md) – DashboardStats type
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T067 – Create app/page.tsx with dashboard layout

**Purpose**: Establish Homepage component with dashboard structure.

**Steps**:
1. Create `app/page.tsx`:
   ```typescript
   'use client';

   import { useEffect } from 'react';
   import { useUIStore, useNodesStore } from '@/lib/store';
   import StatsCard from '@/components/stats-card';
   import RecentNodes from '@/components/recent-nodes';
   import RuleUsageChart from '@/components/rule-usage-chart';
   import ImportDialog from '@/components/import-dialog';

   /**
    * Homepage: Dashboard with stats, recent nodes, import field
    *
    * Layout:
    *   [Stats Cards (4 cols)]
    *   [Import Field (full width)]
    *   [Recent Nodes (left) | Rule Usage Chart (right)]
    *   [Quick Actions (bottom)]
    */
   export default function HomePage() {
     const loadStats = useUIStore(state => state.loadStats);
     const stats = useUIStore(state => state.stats);
     const loadLibrary = useNodesStore(state => state.loadLibrary);

     // Load data on mount
     useEffect(() => {
       loadStats();
       loadLibrary();
     }, [loadStats, loadLibrary]);

     return (
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <StatsCard
             title="Total Nodes"
             value={stats?.totalNodes || 0}
             icon="📦"
           />
           <StatsCard
             title="Total Rules"
             value={stats?.totalRules || 0}
             icon="📏"
           />
           <StatsCard
             title="Avg Coverage"
             value={`${stats?.avgCoverage || 0}%`}
             icon="📊"
           />
           <StatsCard
             title="Last Import"
             value={stats?.lastImportDate || 'Never'}
             icon="📅"
           />
         </div>

         {/* Import Field */}
         <ImportDialog />

         {/* Recent Nodes + Rule Usage Chart */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
           <RecentNodes />
           <RuleUsageChart />
         </div>

         {/* Quick Actions */}
         <div className="flex gap-4 mt-8">
           <button
             onClick={() => window.location.href = '/nodes'}
             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
           >
             View All Nodes
           </button>
           <button
             onClick={() => window.location.href = '/rules'}
             className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
           >
             Manage Rules
           </button>
         </div>
       </div>
     );
   }
   ```

2. Verify page renders with placeholder content

**Files**: `app/page.tsx`

**Parallel?**: No (entry point for dashboard)

**Notes**:
- 'use client' directive: Homepage uses Zustand hooks (client-side only)
- useEffect loads stats + library on mount
- Grid layout: 4 stats cards, full-width import, 2-column recent nodes + chart
- Quick actions navigate to Library (/nodes) and Rule Manager (/rules)

---

### Subtask T068 – Create components/stats-card.tsx for dashboard metrics

**Purpose**: Display individual stat card (total nodes, rules, coverage, last import).

**Steps**:
1. Create `components/stats-card.tsx`:
   ```typescript
   interface StatsCardProps {
     title: string;
     value: string | number;
     icon?: string;
     trend?: {
       value: number; // +5 or -3
       label: string; // "vs last week"
     };
   }

   export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
             {title}
           </h3>
           {icon && <span className="text-2xl">{icon}</span>}
         </div>

         <div className="text-3xl font-bold text-gray-900 dark:text-white">
           {value}
         </div>

         {trend && (
           <div className="mt-2 text-sm">
             <span
               className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}
             >
               {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
             </span>
             <span className="text-gray-500 ml-2">{trend.label}</span>
           </div>
         )}
       </div>
     );
   }
   ```

2. Test with sample data:
   ```typescript
   <StatsCard title="Total Nodes" value={42} icon="📦" />
   <StatsCard
     title="Total Rules"
     value={15}
     icon="📏"
     trend={{ value: 3, label: 'vs last week' }}
   />
   ```

**Files**: `components/stats-card.tsx`

**Parallel?**: Yes (can develop concurrently with T069-T071)

**Notes**:
- Shadcn/ui Card component used for styling (installed in WP01)
- Dark mode support via Tailwind dark: prefix
- Optional trend indicator (for future enhancement - not MVP)
- Icons: Emoji placeholders (can be replaced with React Icons library)

---

### Subtask T069 – Create components/recent-nodes.tsx displaying 5 most recent imports

**Purpose**: Show 5 most recent node imports with thumbnails for quick access.

**Steps**:
1. Create `components/recent-nodes.tsx`:
   ```typescript
   'use client';

   import { useNodesStore } from '@/lib/store';
   import Image from 'next/image';
   import Link from 'next/link';

   export default function RecentNodes() {
     const nodes = useNodesStore(state => state.nodes);

     // Get 5 most recent nodes (sorted by importDate descending)
     const recentNodes = nodes
       .sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime())
       .slice(0, 5);

     if (recentNodes.length === 0) {
       return (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
           <h3 className="text-lg font-semibold mb-4">Recent Nodes</h3>
           <p className="text-gray-500">No nodes imported yet</p>
         </div>
       );
     }

     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
         <h3 className="text-lg font-semibold mb-4">Recent Nodes</h3>

         <div className="space-y-4">
           {recentNodes.map(node => (
             <Link
               key={node.id}
               href={`/viewer/${node.id}`}
               className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             >
               {/* Thumbnail */}
               <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                 {node.thumbnailPath ? (
                   <Image
                     src={`/${node.thumbnailPath}`}
                     alt={node.name}
                     width={64}
                     height={64}
                     className="object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400">
                     📦
                   </div>
                 )}
               </div>

               {/* Node info */}
               <div className="flex-1 min-w-0">
                 <h4 className="font-medium text-gray-900 dark:text-white truncate">
                   {node.name}
                 </h4>
                 <div className="flex items-center gap-2 text-sm text-gray-500">
                   <span>{node.type}</span>
                   <span>•</span>
                   <span>{new Date(node.importDate).toLocaleDateString()}</span>
                 </div>
               </div>

               {/* Coverage badge */}
               <div className="flex-shrink-0">
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
             </Link>
           ))}
         </div>
       </div>
     );
   }
   ```

2. Test with sample nodes data

**Files**: `components/recent-nodes.tsx`

**Parallel?**: Yes (can develop concurrently with T068, T070-T071)

**Notes**:
- Sorted by importDate descending (newest first)
- Limit to 5 nodes (slice(0, 5))
- Thumbnail fallback: emoji icon if screenshot not available
- Coverage badge color-coded: green (≥80%), yellow (≥50%), red (<50%)
- Click navigates to Viewer page (/viewer/{nodeId})

---

### Subtask T070 – Create components/rule-usage-chart.tsx showing top 5 most-matched rules

**Purpose**: Visualize rule usage across library (bar chart of top 5 rules by match count).

**Steps**:
1. Install Recharts:
   ```bash
   npm install recharts@2.10.0
   ```

2. Create `components/rule-usage-chart.tsx`:
   ```typescript
   'use client';

   import { useRulesStore } from '@/lib/store';
   import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

   export default function RuleUsageChart() {
     const rules = useRulesStore(state => state.rules);
     const ruleMatches = useRulesStore(state => state.ruleMatches);

     // Build chart data: top 5 rules by match count
     const chartData = rules
       .map(rule => ({
         name: rule.name.length > 15 ? rule.name.slice(0, 15) + '...' : rule.name,
         matches: ruleMatches.get(rule.id) || 0,
       }))
       .sort((a, b) => b.matches - a.matches)
       .slice(0, 5);

     if (chartData.length === 0) {
       return (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
           <h3 className="text-lg font-semibold mb-4">Rule Usage</h3>
           <p className="text-gray-500">No rules created yet</p>
         </div>
       );
     }

     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
         <h3 className="text-lg font-semibold mb-4">Top 5 Rules by Match Count</h3>

         <ResponsiveContainer width="100%" height={300}>
           <BarChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey="name" />
             <YAxis />
             <Tooltip />
             <Bar dataKey="matches" fill="#3B82F6" />
           </BarChart>
         </ResponsiveContainer>
       </div>
     );
   }
   ```

3. Test with sample rules and match counts

**Files**: `components/rule-usage-chart.tsx`, `package.json`

**Parallel?**: Yes (can develop concurrently with T068-T069, T071)

**Notes**:
- Recharts chosen for simplicity (Chart.js alternative requires more configuration)
- Chart data: rule name (truncated to 15 chars) + match count
- Sorted by match count descending, limit to top 5
- Responsive container: chart fills parent width, fixed height 300px
- Bar color: Tailwind blue-500 (#3B82F6)

---

### Subtask T071 – Create components/import-dialog.tsx with URL input, auto-parsing, import flow

**Purpose**: Import field component with Figma URL input, auto-parsing, and import flow.

**Steps**:
1. Create `components/import-dialog.tsx`:
   ```typescript
   'use client';

   import { useState } from 'react';
   import { useNodesStore, useUIStore } from '@/lib/store';
   import { parseFigmaURL } from '@/lib/utils/url-parser';

   export default function ImportDialog() {
     const [url, setUrl] = useState('');
     const [error, setError] = useState('');
     const importNode = useNodesStore(state => state.importNode);
     const loadLibrary = useNodesStore(state => state.loadLibrary);
     const setImporting = useUIStore(state => state.setImporting);
     const isImporting = useUIStore(state => state.isImporting);
     const invalidateStats = useUIStore(state => state.invalidateStats);

     const handleImport = async () => {
       setError('');

       // Validate URL
       const parsed = parseFigmaURL(url);
       if (!parsed) {
         setError('Invalid Figma URL. Expected format: https://www.figma.com/file/{fileKey}/...?node-id={nodeId}');
         return;
       }

       setImporting(true);

       try {
         // Call import API route (WP03)
         const response = await fetch('/api/figma/import', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             fileKey: parsed.fileKey,
             nodeId: parsed.nodeId,
           }),
         });

         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || 'Import failed');
         }

         const nodeMetadata = await response.json();

         // Update nodes-store
         importNode(nodeMetadata);

         // Reload library to get updated data
         await loadLibrary();

         // Invalidate stats cache (force recalculation)
         invalidateStats();

         // Clear input
         setUrl('');

         // TODO: Show success toast (will be implemented with toast library)
         console.log('Node imported successfully:', nodeMetadata.name);
       } catch (err: any) {
         setError(err.message || 'Failed to import node');
         console.error('Import error:', err);
       } finally {
         setImporting(false);
       }
     };

     return (
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
         <h3 className="text-lg font-semibold mb-4">Import Figma Node</h3>

         <div className="flex gap-4">
           <input
             type="text"
             value={url}
             onChange={(e) => setUrl(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleImport()}
             placeholder="Paste Figma URL (https://www.figma.com/file/...?node-id=...)"
             className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             disabled={isImporting}
           />

           <button
             onClick={handleImport}
             disabled={isImporting || !url}
             className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
           >
             {isImporting ? 'Importing...' : 'Import'}
           </button>
         </div>

         {error && (
           <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
             {error}
           </div>
         )}
       </div>
     );
   }
   ```

2. Test import flow:
   - Paste valid Figma URL → import succeeds, node appears in library
   - Paste invalid URL → error message shown
   - Press Enter key → import triggers

**Files**: `components/import-dialog.tsx`

**Parallel?**: Yes (can develop concurrently with T068-T070)

**Notes**:
- URL auto-parsed via parseFigmaURL() from WP03
- Import flow calls `/api/figma/import` (WP03)
- Loading state: isImporting flag shows "Importing..." button text
- Error handling: shows error message in red banner
- Success: clears input, reloads library, invalidates stats cache
- Enter key shortcut: onKeyDown triggers import

---

### Subtask T072 – Create hooks/use-library-stats.ts to calculate dashboard stats

**Purpose**: Custom hook to load and cache dashboard stats from ui-store.

**Steps**:
1. Create `hooks/use-library-stats.ts`:
   ```typescript
   import { useEffect } from 'react';
   import { useUIStore } from '@/lib/store';

   /**
    * Custom hook: Load library stats with automatic refresh
    *
    * Usage:
    *   const stats = useLibraryStats();
    *   console.log(stats?.totalNodes);
    *
    * Auto-refreshes stats on mount and when invalidated
    */
   export function useLibraryStats() {
     const loadStats = useUIStore(state => state.loadStats);
     const stats = useUIStore(state => state.stats);

     useEffect(() => {
       // Load stats on mount
       loadStats();
     }, [loadStats]);

     return stats;
   }
   ```

2. Use in components:
   ```typescript
   import { useLibraryStats } from '@/hooks/use-library-stats';

   function Dashboard() {
     const stats = useLibraryStats();

     return <div>Total nodes: {stats?.totalNodes}</div>;
   }
   ```

**Files**: `hooks/use-library-stats.ts`

**Parallel?**: Yes (can develop concurrently with other components)

**Notes**:
- Wraps ui-store.loadStats() for cleaner component code
- Stats cached with 5-minute TTL (ui-store logic from WP07)
- Auto-loads on mount, manual refresh via invalidateStats()
- Returns null while loading (components should handle null state)

---

### Subtask T073 – Implement import flow: paste URL → parse → call API → update library

**Purpose**: End-to-end import flow integration (already implemented in T071, validate here).

**Steps**:
1. Test complete import flow:
   - User pastes Figma URL: `https://www.figma.com/file/ABC123/Design?node-id=1-2`
   - parseFigmaURL() extracts: `{ fileKey: 'ABC123', nodeId: '1-2' }`
   - POST to `/api/figma/import` with fileKey + nodeId
   - API route (WP03) fetches Figma data, saves to `figma-data/1-2/`, updates library index
   - importNode() adds metadata to nodes-store
   - loadLibrary() reloads library from API
   - invalidateStats() forces stats recalculation
   - Success toast shown (placeholder console.log for now)

2. Verify state updates:
   - Open Zustand DevTools
   - Trigger import
   - Verify actions: NodesStore/importNode, NodesStore/loadLibrary, UIStore/invalidateStats
   - Verify nodes array grows by 1
   - Verify stats update within 1 second (Success Criteria SC-012)

**Files**: None (validation step)

**Parallel?**: No (requires T071 complete)

**Notes**:
- Success Criteria SC-012: Stats accurate and update within 1 second of changes
- Integration with WP03 API routes (figma/import, library/index, library/stats)
- Error scenarios tested: invalid URL, missing token, network failure, rate limit

---

### Subtask T074 – Add quick action buttons: "View All Nodes" → /nodes, "Manage Rules" → /rules

**Purpose**: Quick navigation buttons for common actions (already implemented in T067, validate here).

**Steps**:
1. Verify quick actions in `app/page.tsx`:
   ```typescript
   <button
     onClick={() => window.location.href = '/nodes'}
     className="..."
   >
     View All Nodes
   </button>
   <button
     onClick={() => window.location.href = '/rules'}
     className="..."
   >
     Manage Rules
   </button>
   ```

2. Test navigation:
   - Click "View All Nodes" → navigates to `/nodes` (Library page)
   - Click "Manage Rules" → navigates to `/rules` (Rule Manager page)

3. Optional enhancement: Use Next.js Link for client-side navigation:
   ```typescript
   import Link from 'next/link';

   <Link href="/nodes" className="...">
     <button>View All Nodes</button>
   </Link>
   ```

**Files**: `app/page.tsx`

**Parallel?**: Yes (UI enhancement)

**Notes**:
- Quick actions provide 1-click navigation to common pages
- window.location.href works but causes full page reload
- Next.js Link recommended for client-side navigation (faster)

---

### Subtask T075 – Test complete homepage flow: stats load, import node, stats update, recent nodes show new import

**Purpose**: End-to-end validation of Homepage dashboard functionality.

**Steps**:
1. Create E2E test in `__tests__/e2e/homepage.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Homepage Dashboard', () => {
     test('should display dashboard stats on load', async ({ page }) => {
       await page.goto('/');

       // Verify stats cards visible
       await expect(page.getByText('Total Nodes')).toBeVisible();
       await expect(page.getByText('Total Rules')).toBeVisible();
       await expect(page.getByText('Avg Coverage')).toBeVisible();
       await expect(page.getByText('Last Import')).toBeVisible();

       // Verify stats values displayed (not "0" if library has data)
       const totalNodesValue = await page.locator('text=Total Nodes').locator('..').locator('div.text-3xl').textContent();
       expect(totalNodesValue).not.toBeNull();
     });

     test('should display recent nodes section', async ({ page }) => {
       await page.goto('/');

       // Verify recent nodes section
       await expect(page.getByText('Recent Nodes')).toBeVisible();

       // If nodes exist, verify first node is clickable
       const firstNode = page.locator('a[href^="/viewer/"]').first();
       if (await firstNode.count() > 0) {
         await expect(firstNode).toBeVisible();
       }
     });

     test('should display rule usage chart', async ({ page }) => {
       await page.goto('/');

       // Verify chart section
       await expect(page.getByText('Top 5 Rules by Match Count')).toBeVisible();
     });

     test('should import node and update dashboard', async ({ page }) => {
       await page.goto('/');

       // Get initial total nodes count
       const initialCount = await page.locator('text=Total Nodes').locator('..').locator('div.text-3xl').textContent();

       // Paste Figma URL (replace with valid test URL)
       const testURL = 'https://www.figma.com/file/ABC123/Test?node-id=1-2';
       await page.fill('input[placeholder*="Paste Figma URL"]', testURL);
       await page.click('button:has-text("Import")');

       // Wait for import to complete (button text changes)
       await expect(page.getByText('Importing...')).toBeVisible();
       await expect(page.getByText('Import')).toBeVisible({ timeout: 15000 });

       // Verify stats updated
       const updatedCount = await page.locator('text=Total Nodes').locator('..').locator('div.text-3xl').textContent();
       expect(parseInt(updatedCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));

       // Verify new node appears in recent nodes
       await expect(page.locator('a[href^="/viewer/"]').first()).toBeVisible();
     });

     test('should navigate to library via quick action', async ({ page }) => {
       await page.goto('/');

       // Click "View All Nodes" button
       await page.click('button:has-text("View All Nodes")');

       // Verify navigation to /nodes
       await expect(page).toHaveURL('/nodes');
     });
   });
   ```

2. Run E2E tests:
   ```bash
   npm run test:e2e homepage.spec.ts
   ```

3. Manual testing checklist:
   - [ ] Homepage loads with stats cards
   - [ ] Stats show correct values (match library + rules count)
   - [ ] Recent nodes section displays 5 most recent
   - [ ] Rule usage chart shows top 5 rules
   - [ ] Import field accepts Figma URL
   - [ ] Import flow: paste URL → click Import → stats update within 1s
   - [ ] Quick actions navigate to /nodes and /rules
   - [ ] Dark mode toggles correctly (if theme implemented)

**Files**: `__tests__/e2e/homepage.spec.ts`

**Parallel?**: No (requires all components complete)

**Notes**:
- E2E tests validate complete user workflow
- Success Criteria SC-012: Stats update within 1 second of changes (measure with Playwright timings)
- Test requires valid Figma access token in .env.local
- Mock Figma API responses for consistent E2E tests (optional enhancement)

## Definition of Done Checklist

- [ ] `app/page.tsx` created with dashboard layout
- [ ] `components/stats-card.tsx` created and displays stats correctly
- [ ] `components/recent-nodes.tsx` created and shows 5 most recent nodes
- [ ] `components/rule-usage-chart.tsx` created with Recharts bar chart
- [ ] `components/import-dialog.tsx` created with URL input and import flow
- [ ] `hooks/use-library-stats.ts` created for stats loading
- [ ] Import flow tested: paste URL → parse → API call → library updates
- [ ] Quick action buttons navigate to /nodes and /rules
- [ ] E2E tests written and passing (homepage.spec.ts)
- [ ] Success Criteria SC-012 verified: Stats update within 1 second of changes
- [ ] User Story 3 (Dashboard) fully implemented
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. Dashboard stats display: total nodes, total rules, avg coverage, last import date
2. Stats cached with 5-minute TTL (ui-store logic)
3. Recent nodes sorted by importDate descending, limited to 5
4. Rule usage chart shows top 5 rules by match count (bar chart)
5. Import dialog: URL validation, auto-parsing, API call, state updates
6. Stats update within 1 second of import (Success Criteria SC-012)
7. Quick actions navigate correctly (/nodes, /rules)

**Reviewers should verify**:
- No `any` types in components (TypeScript strict mode)
- Stats cards responsive (grid layout: 1 col mobile, 4 cols desktop)
- Recent nodes clickable (navigate to /viewer/{nodeId})
- Import error handling: shows error message for invalid URL, missing token, API failures
- Chart library (Recharts) renders correctly in light + dark mode
- E2E tests cover happy path (load → import → stats update) + error scenarios
- Performance: Dashboard loads in <500ms (50 nodes library)

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
