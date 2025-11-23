---
work_package_id: "WP03"
subtasks: ["T017", "T018", "T019", "T020", "T021", "T022", "T023"]
title: "Figma API Client & Caching"
phase: "Phase 1 - Core Library"
lane: "for_review"
agent: "claude"
shell_pid: "71589"
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated"
---

# WP03 – Figma API Client & Caching

## Objectives
Implement Figma REST API integration with server-side proxy, filesystem caching, and error handling. Achieve data locality (constitution Principle III).

## Subtasks
- T017: lib/figma-client.ts - fetchNode(), fetchVariables(), fetchScreenshot()
- T018: lib/utils/file-storage.ts - saveFigmaData(), loadFigmaData()
- T019: app/api/figma/fetch/route.ts - POST handler
- T020: app/api/figma/refresh/route.ts - cache invalidation
- T021: Error handling (auth, rate limits, network)
- T022: Test with mocked API responses
- T023: Verify offline mode works

## Key Implementation Notes
- Use process.env.FIGMA_ACCESS_TOKEN (server-side only)
- Endpoints: GET /v1/files/{key}/nodes, GET /v1/files/{key}/variables/local, GET /images/{key}
- Save to figma-data/{nodeId}.json, {nodeId}-variables.json, {nodeId}-screenshot.png
- Use Node.js fs.promises for async file operations

## Definition of Done
- [ ] API client calls Figma endpoints successfully
- [ ] Data cached locally in figma-data/
- [ ] Offline mode verified (loads from cache without API call)
- [ ] Error messages clear and actionable

## Activity Log

- 2025-11-23T18:10:09Z – claude – shell_pid=78160 – lane=doing – Starting Figma API Client & Caching implementation
- 2025-11-23T18:20:49Z – claude – shell_pid=71589 – lane=for_review – Completed all 7 subtasks. Build succeeds with zero TypeScript errors. All 17 tests passing, including comprehensive offline mode integration tests. Constitutional Principle III verified: fetch once, cache forever.
