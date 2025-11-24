---
work_package_id: "WP03"
subtasks:
  - "T022"
  - "T023"
  - "T024"
  - "T025"
  - "T026"
  - "T027"
  - "T028"
  - "T029"
  - "T030"
  - "T031"
  - "T032"
title: "Multi-Node Storage & Figma Client"
phase: "Phase 1 - Core Engine"
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

# Work Package Prompt: WP03 – Multi-Node Storage & Figma Client

## Objectives & Success Criteria

Implement Figma REST API integration with multi-node storage structure, library index management, and offline-first architecture. Enable importing multiple nodes, storing each independently with metadata and thumbnails, and operating entirely offline after initial imports.

**Success Criteria**:
- Import 3 nodes, verify `figma-data/{nodeId}/` directories created for each
- `library-index.json` updated with all 3 nodes
- Load library without API calls (offline mode verification)
- Error handling for API failures (authentication, rate limits, invalid URLs)
- Re-fetch individual nodes updates cached data correctly
- Success Criteria SC-001: Import completes within 10 seconds

## Context & Constraints

**Architecture**: Multi-node library manager with file-based storage (`figma-data/{nodeId}/data.json`, `metadata.json`, `screenshot.png`)

**Key Decisions from Planning**:
- Figma REST API v1 with server-side proxy via Next.js API routes
- Personal access token stored in `.env.local` (server-side only, never client-side)
- File-based storage (no database) per Constitution Principle III
- Offline-first: fetch once, operate indefinitely without API calls
- Multi-node structure: Each node in separate directory with unique ID

**Constitutional Principles**:
- Principle III: Data Locality (NON-NEGOTIABLE) – Fetch once, operate offline
- Principle I: Developer Experience First – Clear error messages, retry options
- Principle VI: Simple Before Clever – File-based storage over database complexity

**Related Documents**:
- [plan.md](../plan.md) – API contracts, storage structure
- [spec.md](../spec.md) – User Story 1 (Import Nodes), FR-001 to FR-007
- [data-model.md](../data-model.md) – LibraryIndex, NodeMetadata entities

## Subtasks & Detailed Guidance

### Subtask T022 – Create lib/figma-client.ts with fetchNode(), fetchVariables(), fetchScreenshot()

**Purpose**: Implement Figma REST API client for fetching node data, variables, and screenshots.

**Steps**:
1. Create `lib/figma-client.ts`

2. Implement `fetchNode()` function:
   ```typescript
   import type { FigmaNode } from './types/figma';

   export async function fetchNode(
     fileKey: string,
     nodeId: string
   ): Promise<FigmaNode> {
     const token = process.env.FIGMA_ACCESS_TOKEN;
     if (!token) {
       throw new Error('FIGMA_ACCESS_TOKEN not set in .env.local');
     }

     const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`;
     const response = await fetch(url, {
       headers: { 'X-Figma-Token': token },
     });

     if (!response.ok) {
       if (response.status === 401) {
         throw new Error('Invalid Figma access token. Check Settings.');
       }
       if (response.status === 429) {
         throw new Error('Figma API rate limit exceeded. Try again in 1 minute.');
       }
       throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
     }

     const data = await response.json();
     const nodeData = data.nodes?.[nodeId]?.document;
     if (!nodeData) {
       throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
     }

     return nodeData as FigmaNode;
   }
   ```

3. Implement `fetchVariables()` function:
   ```typescript
   export async function fetchVariables(fileKey: string): Promise<Record<string, unknown>> {
     const token = process.env.FIGMA_ACCESS_TOKEN!;
     const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;

     const response = await fetch(url, {
       headers: { 'X-Figma-Token': token },
     });

     if (!response.ok) return {}; // Variables optional, return empty if not found

     return await response.json();
   }
   ```

4. Implement `fetchScreenshot()` function:
   ```typescript
   export async function fetchScreenshot(
     fileKey: string,
     nodeId: string
   ): Promise<Buffer> {
     const token = process.env.FIGMA_ACCESS_TOKEN!;
     const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`;

     const response = await fetch(url, {
       headers: { 'X-Figma-Token': token },
     });

     if (!response.ok) {
       throw new Error(`Screenshot fetch failed: ${response.status}`);
     }

     const data = await response.json();
     const imageUrl = data.images?.[nodeId];
     if (!imageUrl) {
       throw new Error('Screenshot URL not returned by Figma API');
     }

     // Fetch actual image
     const imageResponse = await fetch(imageUrl);
     const arrayBuffer = await imageResponse.arrayBuffer();
     return Buffer.from(arrayBuffer);
   }
   ```

5. Add exponential backoff for rate limits:
   ```typescript
   async function fetchWithRetry<T>(
     fetcher: () => Promise<T>,
     maxRetries = 3
   ): Promise<T> {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fetcher();
       } catch (error) {
         if (error instanceof Error && error.message.includes('rate limit')) {
           const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

**Files**: `lib/figma-client.ts`

**Parallel?**: No (foundational module)

**Notes**:
- Use `process.env.FIGMA_ACCESS_TOKEN` (server-side only)
- Screenshot scale=2 for Retina displays
- Figma API v1 documented at https://www.figma.com/developers/api

---

### Subtask T023 – Create lib/utils/file-storage.ts with saveNodeData(), loadNodeData(), updateLibraryIndex()

**Purpose**: Implement multi-node file storage operations.

**Steps**:
1. Create `lib/utils/file-storage.ts`

2. Implement `saveNodeData()` function:
   ```typescript
   import fs from 'fs/promises';
   import path from 'path';
   import type { FigmaNode } from '../types/figma';
   import type { NodeMetadata } from '../types/library';

   const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');

   export async function saveNodeData(
     nodeId: string,
     nodeData: FigmaNode,
     fileKey: string,
     screenshot: Buffer
   ): Promise<NodeMetadata> {
     const nodeDirPath = path.join(FIGMA_DATA_DIR, nodeId.replace(':', '-'));

     // Create directory
     await fs.mkdir(nodeDirPath, { recursive: true });

     // Save data.json
     await fs.writeFile(
       path.join(nodeDirPath, 'data.json'),
       JSON.stringify(nodeData, null, 2)
     );

     // Save metadata.json
     const metadata: NodeMetadata = {
       id: nodeId,
       name: nodeData.name,
       type: nodeData.type,
       importDate: new Date().toISOString(),
       thumbnailPath: `figma-data/${nodeId.replace(':', '-')}/screenshot.png`,
       dataPath: `figma-data/${nodeId.replace(':', '-')}/data.json`,
       fileKey,
     };
     await fs.writeFile(
       path.join(nodeDirPath, 'metadata.json'),
       JSON.stringify(metadata, null, 2)
     );

     // Save screenshot.png
     await fs.writeFile(
       path.join(nodeDirPath, 'screenshot.png'),
       screenshot
     );

     return metadata;
   }
   ```

3. Implement `loadNodeData()` function:
   ```typescript
   export async function loadNodeData(nodeId: string): Promise<FigmaNode | null> {
     const nodeDirPath = path.join(FIGMA_DATA_DIR, nodeId.replace(':', '-'));
     const dataPath = path.join(nodeDirPath, 'data.json');

     try {
       const fileContent = await fs.readFile(dataPath, 'utf-8');
       return JSON.parse(fileContent) as FigmaNode;
     } catch (error) {
       return null; // File not found
     }
   }
   ```

4. Implement `loadNodeMetadata()` function:
   ```typescript
   export async function loadNodeMetadata(nodeId: string): Promise<NodeMetadata | null> {
     const nodeDirPath = path.join(FIGMA_DATA_DIR, nodeId.replace(':', '-'));
     const metadataPath = path.join(nodeDirPath, 'metadata.json');

     try {
       const fileContent = await fs.readFile(metadataPath, 'utf-8');
       return JSON.parse(fileContent) as NodeMetadata;
     } catch (error) {
       return null;
     }
   }
   ```

5. Implement `deleteNodeData()` function:
   ```typescript
   export async function deleteNodeData(nodeId: string): Promise<void> {
     const nodeDirPath = path.join(FIGMA_DATA_DIR, nodeId.replace(':', '-'));
     await fs.rm(nodeDirPath, { recursive: true, force: true });
   }
   ```

**Files**: `lib/utils/file-storage.ts`

**Parallel?**: Yes (can develop concurrently with T024, T025)

**Notes**:
- Replace `:` with `-` in node IDs for file paths (Windows compatibility)
- Create `figma-data/` directory if not exists
- Use `fs/promises` for async file operations

---

### Subtask T024 – Create lib/utils/library-index.ts with addNode(), removeNode(), searchNodes(), filterNodes(), sortNodes()

**Purpose**: Implement library index management operations.

**Steps**:
1. Create `lib/utils/library-index.ts`

2. Implement `loadLibraryIndex()` function:
   ```typescript
   import fs from 'fs/promises';
   import path from 'path';
   import type { LibraryIndex, NodeMetadata } from '../types/library';

   const LIBRARY_INDEX_PATH = path.join(process.cwd(), 'figma-data', 'library-index.json');

   export async function loadLibraryIndex(): Promise<LibraryIndex> {
     try {
       const fileContent = await fs.readFile(LIBRARY_INDEX_PATH, 'utf-8');
       return JSON.parse(fileContent) as LibraryIndex;
     } catch (error) {
       // Initialize empty index if not exists
       const emptyIndex: LibraryIndex = {
         version: '1.0.0',
         lastUpdated: new Date().toISOString(),
         nodes: [],
       };
       await saveLibraryIndex(emptyIndex);
       return emptyIndex;
     }
   }
   ```

3. Implement `saveLibraryIndex()` function:
   ```typescript
   export async function saveLibraryIndex(index: LibraryIndex): Promise<void> {
     await fs.mkdir(path.dirname(LIBRARY_INDEX_PATH), { recursive: true });
     await fs.writeFile(LIBRARY_INDEX_PATH, JSON.stringify(index, null, 2));
   }
   ```

4. Implement `addNode()` function:
   ```typescript
   export async function addNode(metadata: NodeMetadata): Promise<void> {
     const index = await loadLibraryIndex();

     // Remove existing entry if present (update scenario)
     index.nodes = index.nodes.filter(node => node.id !== metadata.id);

     // Add new entry
     index.nodes.push(metadata);
     index.lastUpdated = new Date().toISOString();

     await saveLibraryIndex(index);
   }
   ```

5. Implement `removeNode()` function:
   ```typescript
   export async function removeNode(nodeId: string): Promise<void> {
     const index = await loadLibraryIndex();
     index.nodes = index.nodes.filter(node => node.id !== nodeId);
     index.lastUpdated = new Date().toISOString();
     await saveLibraryIndex(index);
   }
   ```

6. Implement `searchNodes()` function:
   ```typescript
   export function searchNodes(nodes: NodeMetadata[], query: string): NodeMetadata[] {
     const lowerQuery = query.toLowerCase();
     return nodes.filter(node =>
       node.name.toLowerCase().includes(lowerQuery) ||
       node.id.includes(query)
     );
   }
   ```

7. Implement `filterNodes()` function:
   ```typescript
   import type { LibraryFilters } from '../types/library';

   export function filterNodes(nodes: NodeMetadata[], filters: LibraryFilters): NodeMetadata[] {
     let filtered = nodes;

     if (filters.type) {
       filtered = filtered.filter(node => node.type === filters.type);
     }

     if (filters.coverage) {
       if (filters.coverage === 'with-rules') {
         filtered = filtered.filter(node => (node.coverage ?? 0) > 0);
       } else if (filters.coverage === 'without-rules') {
         filtered = filtered.filter(node => (node.coverage ?? 0) === 0);
       }
     }

     return filtered;
   }
   ```

8. Implement `sortNodes()` function:
   ```typescript
   import type { LibrarySortCriteria, SortOrder } from '../types/library';

   export function sortNodes(
     nodes: NodeMetadata[],
     criteria: LibrarySortCriteria,
     order: SortOrder
   ): NodeMetadata[] {
     const sorted = [...nodes].sort((a, b) => {
       let comparison = 0;

       switch (criteria) {
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
           comparison = (a.coverage ?? 0) - (b.coverage ?? 0);
           break;
       }

       return order === 'asc' ? comparison : -comparison;
     });

     return sorted;
   }
   ```

**Files**: `lib/utils/library-index.ts`

**Parallel?**: Yes (can develop concurrently with T023, T025)

**Notes**:
- Library index is the single source of truth for node list
- Search is case-insensitive on both name and ID
- Sort/filter functions pure (no side effects)

---

### Subtask T025 – Create lib/utils/url-parser.ts to extract file_key and node_id from Figma URLs

**Purpose**: Parse Figma URLs to extract file key and node ID for API calls.

**Steps**:
1. Create `lib/utils/url-parser.ts`

2. Implement `parseFigmaUrl()` function:
   ```typescript
   export interface ParsedFigmaUrl {
     fileKey: string;
     nodeId: string;
   }

   export function parseFigmaUrl(url: string): ParsedFigmaUrl {
     // Support formats:
     // https://www.figma.com/file/{fileKey}/...?node-id={nodeId}
     // https://www.figma.com/design/{fileKey}/...?node-id={nodeId}

     const urlObj = new URL(url);

     // Extract file key from pathname
     const pathMatch = urlObj.pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
     if (!pathMatch) {
       throw new Error(
         'Invalid Figma URL format. Expected: figma.com/file/{fileKey}/...?node-id={nodeId}'
       );
     }
     const fileKey = pathMatch[2];

     // Extract node ID from query parameter
     const nodeId = urlObj.searchParams.get('node-id');
     if (!nodeId) {
       throw new Error('Missing node-id parameter in Figma URL');
     }

     // Validate node ID format (e.g., "123:456" or "123-456")
     const normalizedNodeId = nodeId.replace('-', ':');
     if (!/^\d+:\d+$/.test(normalizedNodeId)) {
       throw new Error(`Invalid node-id format: ${nodeId}. Expected format: 123:456`);
     }

     return {
       fileKey,
       nodeId: normalizedNodeId,
     };
   }
   ```

3. Add validation function:
   ```typescript
   export function isValidFigmaUrl(url: string): boolean {
     try {
       parseFigmaUrl(url);
       return true;
     } catch {
       return false;
     }
   }
   ```

4. Add unit tests:
   ```typescript
   // __tests__/unit/url-parser.test.ts
   import { describe, it, expect } from 'vitest';
   import { parseFigmaUrl, isValidFigmaUrl } from '@/lib/utils/url-parser';

   describe('parseFigmaUrl', () => {
     it('parses /file/ URL format', () => {
       const result = parseFigmaUrl(
         'https://www.figma.com/file/ABC123/My-Design?node-id=1-2'
       );
       expect(result).toEqual({ fileKey: 'ABC123', nodeId: '1:2' });
     });

     it('parses /design/ URL format', () => {
       const result = parseFigmaUrl(
         'https://www.figma.com/design/XYZ789/Project?node-id=10:20'
       );
       expect(result).toEqual({ fileKey: 'XYZ789', nodeId: '10:20' });
     });

     it('throws on missing node-id parameter', () => {
       expect(() =>
         parseFigmaUrl('https://www.figma.com/file/ABC123/Design')
       ).toThrow('Missing node-id parameter');
     });

     it('throws on invalid URL format', () => {
       expect(() =>
         parseFigmaUrl('https://example.com/invalid')
       ).toThrow('Invalid Figma URL format');
     });
   });
   ```

**Files**: `lib/utils/url-parser.ts`, `__tests__/unit/url-parser.test.ts`

**Parallel?**: Yes (can develop concurrently with T023, T024)

**Notes**:
- Support both `/file/` and `/design/` URL patterns
- Normalize node ID to colon format (`123:456`)
- Provide clear error messages for invalid URLs (UX requirement)

---

### Subtask T026 – Implement app/api/figma/import/route.ts (POST: fetch node, save, update library index)

**Purpose**: API route for importing Figma nodes.

**Steps**:
1. Create `app/api/figma/import/route.ts`

2. Implement POST handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { parseFigmaUrl } from '@/lib/utils/url-parser';
   import { fetchNode, fetchScreenshot } from '@/lib/figma-client';
   import { saveNodeData } from '@/lib/utils/file-storage';
   import { addNode } from '@/lib/utils/library-index';

   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       const { url } = body;

       if (!url || typeof url !== 'string') {
         return NextResponse.json(
           { success: false, error: 'Missing or invalid URL parameter' },
           { status: 400 }
         );
       }

       // Parse URL
       const { fileKey, nodeId } = parseFigmaUrl(url);

       // Fetch node data
       const nodeData = await fetchNode(fileKey, nodeId);

       // Fetch screenshot
       const screenshot = await fetchScreenshot(fileKey, nodeId);

       // Save to filesystem
       const metadata = await saveNodeData(nodeId, nodeData, fileKey, screenshot);

       // Update library index
       await addNode(metadata);

       return NextResponse.json({
         success: true,
         nodeId,
         metadata,
       });
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       return NextResponse.json(
         { success: false, error: errorMessage },
         { status: error instanceof Error && errorMessage.includes('Invalid') ? 400 : 500 }
       );
     }
   }
   ```

**Files**: `app/api/figma/import/route.ts`

**Parallel?**: No (depends on T022-T025)

**Notes**:
- Use try-catch for all error handling
- Return 400 for invalid URLs, 500 for API failures
- Success response includes metadata for UI update

---

### Subtask T027 – Implement app/api/figma/refresh/route.ts (POST: re-fetch specific node)

**Purpose**: API route for refreshing cached node data.

**Steps**:
1. Create `app/api/figma/refresh/route.ts`

2. Implement POST handler:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { loadNodeMetadata } from '@/lib/utils/file-storage';
   import { fetchNode, fetchScreenshot } from '@/lib/figma-client';
   import { saveNodeData } from '@/lib/utils/file-storage';
   import { addNode } from '@/lib/utils/library-index';

   export async function POST(request: NextRequest) {
     try {
       const body = await request.json();
       const { nodeId } = body;

       if (!nodeId) {
         return NextResponse.json(
           { success: false, error: 'Missing nodeId parameter' },
           { status: 400 }
         );
       }

       // Load existing metadata to get fileKey
       const existingMetadata = await loadNodeMetadata(nodeId);
       if (!existingMetadata) {
         return NextResponse.json(
           { success: false, error: `Node ${nodeId} not found in library` },
           { status: 404 }
         );
       }

       // Re-fetch from Figma API
       const nodeData = await fetchNode(existingMetadata.fileKey, nodeId);
       const screenshot = await fetchScreenshot(existingMetadata.fileKey, nodeId);

       // Save updated data
       const metadata = await saveNodeData(
         nodeId,
         nodeData,
         existingMetadata.fileKey,
         screenshot
       );

       // Update library index
       await addNode(metadata);

       return NextResponse.json({
         success: true,
         nodeId,
         metadata,
       });
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       return NextResponse.json(
         { success: false, error: errorMessage },
         { status: 500 }
       );
     }
   }
   ```

**Files**: `app/api/figma/refresh/route.ts`

**Parallel?**: Yes (can develop concurrently with T028, T029)

**Notes**:
- Requires node already exists in library (404 if not)
- Updates both data.json and screenshot.png
- Preserves original import date in metadata

---

### Subtask T028 – Implement app/api/library/index/route.ts (GET: load library-index.json)

**Purpose**: API route for loading library index.

**Steps**:
1. Create `app/api/library/index/route.ts`

2. Implement GET handler:
   ```typescript
   import { NextResponse } from 'next/server';
   import { loadLibraryIndex } from '@/lib/utils/library-index';

   export async function GET() {
     try {
       const index = await loadLibraryIndex();
       return NextResponse.json(index);
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       return NextResponse.json(
         { error: errorMessage },
         { status: 500 }
       );
     }
   }
   ```

**Files**: `app/api/library/index/route.ts`

**Parallel?**: Yes (can develop concurrently with T027, T029)

**Notes**:
- Simple read operation, no parameters
- Returns complete LibraryIndex structure
- Used by Zustand nodes-store.loadLibrary()

---

### Subtask T029 – Implement app/api/library/stats/route.ts (GET: calculate dashboard stats)

**Purpose**: API route for calculating dashboard statistics.

**Steps**:
1. Create `app/api/library/stats/route.ts`

2. Implement GET handler with stats calculation:
   ```typescript
   import { NextResponse } from 'next/server';
   import { loadLibraryIndex } from '@/lib/utils/library-index';
   import { loadRules } from '@/lib/utils/rules-storage'; // WP05 dependency
   import { evaluateRules } from '@/lib/rule-engine'; // WP05 dependency
   import { loadNodeData } from '@/lib/utils/file-storage';
   import { transformToAltNode } from '@/lib/altnode-transform'; // WP04 dependency
   import type { DashboardStats } from '@/lib/types/library';

   export async function GET() {
     try {
       const index = await loadLibraryIndex();
       const ruleLibrary = await loadRules(); // Load mapping-rules.json

       // Calculate coverage for each node (requires rule engine - WP05)
       // For now, return placeholder stats
       const stats: DashboardStats = {
         totalNodes: index.nodes.length,
         totalRules: ruleLibrary.rules.length,
         averageCoverage: 0, // TODO: Calculate in WP05 after rule engine implemented
         lastImportDate: index.lastUpdated,
         recentNodes: index.nodes
           .sort((a, b) => new Date(b.importDate).getTime() - new Date(a.importDate).getTime())
           .slice(0, 5),
         topRules: [], // TODO: Calculate in WP05
       };

       return NextResponse.json(stats);
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       return NextResponse.json(
         { error: errorMessage },
         { status: 500 }
       );
     }
   }
   ```

**Files**: `app/api/library/stats/route.ts`

**Parallel?**: Yes (can develop concurrently with T027, T028)

**Notes**:
- Coverage calculation requires WP05 (rule engine)
- Placeholder implementation for now, complete in WP07
- Stats cached in Zustand ui-store with 5-minute TTL

---

### Subtask T030 – Add error handling for API failures

**Purpose**: Comprehensive error handling for all API failure scenarios.

**Steps**:
1. Create `lib/utils/api-errors.ts` with error types:
   ```typescript
   export class FigmaAuthError extends Error {
     constructor() {
       super('Invalid or missing Figma access token. Please configure in Settings.');
       this.name = 'FigmaAuthError';
     }
   }

   export class FigmaRateLimitError extends Error {
     constructor() {
       super('Figma API rate limit exceeded. Please try again in 1 minute.');
       this.name = 'FigmaRateLimitError';
     }
   }

   export class FigmaNodeNotFoundError extends Error {
     constructor(nodeId: string) {
       super(`Node ${nodeId} not found in Figma file. Check URL and node-id parameter.`);
       this.name = 'FigmaNodeNotFoundError';
     }
   }

   export class InvalidFigmaUrlError extends Error {
     constructor(message: string) {
       super(message);
       this.name = 'InvalidFigmaUrlError';
     }
   }

   export class NetworkError extends Error {
     constructor(message: string) {
       super(`Network error: ${message}. Check your internet connection.`);
       this.name = 'NetworkError';
     }
   }
   ```

2. Update `lib/figma-client.ts` to throw typed errors:
   ```typescript
   import {
     FigmaAuthError,
     FigmaRateLimitError,
     FigmaNodeNotFoundError,
     NetworkError,
   } from './utils/api-errors';

   export async function fetchNode(fileKey: string, nodeId: string): Promise<FigmaNode> {
     const token = process.env.FIGMA_ACCESS_TOKEN;
     if (!token) throw new FigmaAuthError();

     try {
       const response = await fetch(/* ... */);

       if (response.status === 401) throw new FigmaAuthError();
       if (response.status === 429) throw new FigmaRateLimitError();
       if (response.status === 404) throw new FigmaNodeNotFoundError(nodeId);

       // ... rest of implementation
     } catch (error) {
       if (error instanceof TypeError) {
         throw new NetworkError(error.message);
       }
       throw error;
     }
   }
   ```

3. Update API routes to handle typed errors:
   ```typescript
   // app/api/figma/import/route.ts
   catch (error) {
     if (error instanceof FigmaAuthError) {
       return NextResponse.json(
         { success: false, error: error.message, code: 'AUTH_ERROR' },
         { status: 401 }
       );
     }
     if (error instanceof FigmaRateLimitError) {
       return NextResponse.json(
         { success: false, error: error.message, code: 'RATE_LIMIT' },
         { status: 429 }
       );
     }
     // ... handle other error types
   }
   ```

**Files**: `lib/utils/api-errors.ts`, updated `lib/figma-client.ts`, updated API routes

**Parallel?**: No (depends on T022, T026-T029)

**Notes**:
- Typed errors enable specific UI responses (e.g., "Go to Settings" link for auth errors)
- Error codes allow client-side error handling logic
- User-friendly messages per Constitution Principle I

---

### Subtask T031 – Test multi-node storage: import nodes with different IDs, verify directory structure

**Purpose**: Integration test for multi-node storage workflow.

**Steps**:
1. Create `__tests__/integration/multi-node-storage.test.ts`

2. Implement test cases:
   ```typescript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import { saveNodeData, loadNodeData, deleteNodeData } from '@/lib/utils/file-storage';
   import { addNode, removeNode, loadLibraryIndex } from '@/lib/utils/library-index';
   import type { FigmaNode } from '@/lib/types/figma';

   describe('Multi-Node Storage', () => {
     const testNode1: FigmaNode = {
       id: '1:1',
       name: 'Test Node 1',
       type: 'FRAME',
     };

     const testNode2: FigmaNode = {
       id: '2:2',
       name: 'Test Node 2',
       type: 'COMPONENT',
     };

     afterEach(async () => {
       // Cleanup
       await deleteNodeData('1:1');
       await deleteNodeData('2:2');
     });

     it('saves multiple nodes in separate directories', async () => {
       const screenshot = Buffer.from('fake-png-data');

       await saveNodeData('1:1', testNode1, 'fileKey123', screenshot);
       await saveNodeData('2:2', testNode2, 'fileKey123', screenshot);

       const loaded1 = await loadNodeData('1:1');
       const loaded2 = await loadNodeData('2:2');

       expect(loaded1).toEqual(testNode1);
       expect(loaded2).toEqual(testNode2);
     });

     it('updates library index with all nodes', async () => {
       const screenshot = Buffer.from('fake-png-data');

       const metadata1 = await saveNodeData('1:1', testNode1, 'fileKey123', screenshot);
       const metadata2 = await saveNodeData('2:2', testNode2, 'fileKey123', screenshot);

       await addNode(metadata1);
       await addNode(metadata2);

       const index = await loadLibraryIndex();
       expect(index.nodes).toHaveLength(2);
       expect(index.nodes.map(n => n.id)).toEqual(['1:1', '2:2']);
     });

     it('removes node from library index', async () => {
       const screenshot = Buffer.from('fake-png-data');
       const metadata = await saveNodeData('1:1', testNode1, 'fileKey123', screenshot);
       await addNode(metadata);

       await removeNode('1:1');

       const index = await loadLibraryIndex();
       expect(index.nodes).toHaveLength(0);
     });
   });
   ```

**Files**: `__tests__/integration/multi-node-storage.test.ts`

**Parallel?**: No (final integration test after T022-T030)

**Notes**:
- Clean up test files in `afterEach` hook
- Use mock data for Figma API responses
- Verify directory structure matches specification

---

### Subtask T032 – Verify offline mode: Load library index, load cached nodes, no Figma API calls after initial import

**Purpose**: Validate offline-first architecture (Constitution Principle III).

**Steps**:
1. Create `__tests__/integration/offline-mode.test.ts`

2. Implement offline verification test:
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { loadLibraryIndex } from '@/lib/utils/library-index';
   import { loadNodeData } from '@/lib/utils/file-storage';
   import * as figmaClient from '@/lib/figma-client';

   describe('Offline Mode', () => {
     it('loads library without Figma API calls', async () => {
       // Spy on Figma client functions
       const fetchNodeSpy = vi.spyOn(figmaClient, 'fetchNode');
       const fetchScreenshotSpy = vi.spyOn(figmaClient, 'fetchScreenshot');

       // Load library index (should read from file, not API)
       const index = await loadLibraryIndex();

       // Load cached node data (should read from file, not API)
       if (index.nodes.length > 0) {
         const nodeData = await loadNodeData(index.nodes[0].id);
         expect(nodeData).toBeTruthy();
       }

       // Verify no API calls made
       expect(fetchNodeSpy).not.toHaveBeenCalled();
       expect(fetchScreenshotSpy).not.toHaveBeenCalled();
     });

     it('operates with network disabled', async () => {
       // Mock fetch to simulate offline network
       global.fetch = vi.fn(() =>
         Promise.reject(new Error('Network error: Offline'))
       );

       // Should still load cached data
       const index = await loadLibraryIndex();
       expect(index).toBeTruthy();

       if (index.nodes.length > 0) {
         const nodeData = await loadNodeData(index.nodes[0].id);
         expect(nodeData).toBeTruthy();
       }
     });
   });
   ```

3. Manual verification checklist:
   - [ ] Import 3 nodes via `/api/figma/import`
   - [ ] Open Network tab in DevTools
   - [ ] Disable network (offline mode)
   - [ ] Navigate to `/nodes` page
   - [ ] Verify library loads with all 3 nodes
   - [ ] Navigate to `/viewer/{nodeId}` for each node
   - [ ] Verify all data displays correctly
   - [ ] Confirm zero Figma API calls in Network tab

**Files**: `__tests__/integration/offline-mode.test.ts`, manual verification checklist

**Parallel?**: No (final validation after all subtasks)

**Notes**:
- Offline mode is constitutional requirement (Principle III: NON-NEGOTIABLE)
- Manual verification required to confirm real-world offline usage
- Document offline capabilities in README.md

## Definition of Done Checklist

- [ ] Figma client functions implemented (fetchNode, fetchVariables, fetchScreenshot)
- [ ] Multi-node file storage working (`figma-data/{nodeId}/data.json`, `metadata.json`, `screenshot.png`)
- [ ] Library index management complete (add, remove, search, filter, sort)
- [ ] URL parser handles both `/file/` and `/design/` formats
- [ ] Import API route creates directories and updates library index
- [ ] Refresh API route updates cached data correctly
- [ ] Library index API route returns complete LibraryIndex
- [ ] Dashboard stats API route calculates metrics (placeholder for WP05)
- [ ] Error handling covers authentication, rate limits, network issues, invalid URLs
- [ ] Integration tests pass for multi-node storage
- [ ] Offline mode verified (zero API calls after initial imports)
- [ ] Success Criteria SC-001: Import completes within 10 seconds

## Review Guidance

**Key Acceptance Checkpoints**:
1. Multi-node storage structure matches specification (`figma-data/{nodeId}/`)
2. Library index updated atomically with node imports
3. Offline mode works (no API calls after initial imports)
4. Error messages user-friendly with actionable guidance
5. URL parser handles all Figma URL formats
6. Integration tests pass with real file I/O

**Reviewers should verify**:
- No API calls in offline scenario (check with Network tab disabled)
- Library index consistency after concurrent imports
- Error handling for all failure scenarios (auth, rate limits, network)
- File paths Windows-compatible (no `:` in filenames)

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
