---
work_package_id: "WP13"
subtasks:
  - "T124"
  - "T125"
  - "T126"
  - "T127"
  - "T128"
  - "T129"
  - "T130"
  - "T131"
title: "Global Navigation & Layout"
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

# Work Package Prompt: WP13 – Global Navigation & Layout

## Objectives & Success Criteria

Implement top navigation bar, page routing, breadcrumbs, and state preservation across navigation. This provides consistent global navigation and ensures state persistence throughout the application.

**Success Criteria**:
- Top navigation always visible on all pages (Logo | Home | Library | Rules | Settings)
- Active page highlighting in navigation
- Next.js Link components for client-side routing
- Breadcrumbs for Viewer page (Home > Library > NodeName)
- Zustand state persists across page navigation (selected node, filters, search terms)
- Browser back/forward navigation restores page state correctly
- Success Criteria SC-004: Navigate between pages, return to previous state without data loss

## Subtasks Summary

### T124 – Create app/layout.tsx with top navigation bar
Root layout component with persistent navigation bar visible on all pages.

### T125 – Create components/navigation.tsx with active page highlighting
Navigation component with logo, page links, and active state indication.

### T126 – Implement routing with Next.js Link components
Client-side navigation using Next.js Link for all page transitions.

### T127 – Add breadcrumbs component for Viewer page
Breadcrumb navigation showing hierarchy (Home > Library > NodeName).

### T128 – Setup Zustand state persistence for navigation
Configure Zustand persist middleware for UI state (selected node, filters, search).

### T129 – Implement browser back/forward navigation: restore page state
Ensure browser history navigation restores correct application state.

### T130 – Test navigation flow: all pages, back/forward, state preserved
End-to-end testing of navigation and state persistence.

### T131 – Verify Success Criteria SC-004: state preserved across navigation
Validate that navigating between pages preserves application state.

## Implementation Notes

- Top nav: Shadcn/ui NavigationMenu, always visible
- Active page: usePathname() hook highlights current page
- State preservation: Zustand stores persist in memory, localStorage for UI preferences
- Browser navigation: Next.js App Router handles history, Zustand state remains
- Constitution Principle IX: Separation of Pages - distinct pages for viewing, editing, management

## Definition of Done

- [ ] `app/layout.tsx` created with top navigation bar
- [ ] `components/navigation.tsx` with logo and page links
- [ ] Active page highlighting works (current page visually distinct)
- [ ] Next.js Link components for all navigation
- [ ] Breadcrumbs component added to Viewer page
- [ ] Zustand state persists across navigation
- [ ] Browser back/forward restores correct state
- [ ] All pages accessible via navigation (/, /nodes, /rules, /settings)
- [ ] Success Criteria SC-004 verified: state preserved

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
