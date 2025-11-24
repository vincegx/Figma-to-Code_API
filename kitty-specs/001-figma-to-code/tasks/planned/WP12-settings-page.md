---
work_package_id: "WP12"
subtasks:
  - "T114"
  - "T115"
  - "T116"
  - "T117"
  - "T118"
  - "T119"
  - "T120"
  - "T121"
  - "T122"
  - "T123"
title: "Settings Page"
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

# Work Package Prompt: WP12 – Settings Page

## Objectives & Success Criteria

Build Settings page (`app/settings/page.tsx`) with 5 sections: Figma API configuration, Export Preferences, Rule Editor settings, Cache Management, and Appearance (theme). This page enables users to configure application behavior and manage local data.

**Success Criteria**:
- 5 sections: Figma API, Export Preferences, Rule Editor, Cache Management, Appearance
- Figma token: Masked input with show/hide, "Test Connection" button
- Export preferences: Default framework, language, formatting options
- Rule editor: Auto-save toggle, default priority for new rules
- Cache management: Display size, "Clear All Cache", "Re-fetch All Nodes"
- Appearance: Theme selector (Light, Dark, System) with immediate UI update
- Settings persist in localStorage (UI preferences) and .env.local (Figma token)
- Success Criteria SC-013: App operates offline after initial imports
- User Story 6 (Settings) fully implemented

## Subtasks Summary

### T114 – Create app/settings/page.tsx with 5 sections layout
Create settings page with tabbed or sectioned layout for 5 configuration areas.

### T115 – Figma API section: token input, show/hide, API base URL
Masked token input with visibility toggle and optional API base URL configuration.

### T116 – "Test Connection" button: call Figma API `/v1/me`
Test button validates Figma token by calling authentication endpoint, shows success/failure toast.

### T117 – Export Preferences section: default framework, language, formatting
Configure default export format (React JSX/Tailwind/HTML), language (TypeScript/JavaScript), code formatting options.

### T118 – Rule Editor section: auto-save toggle, default priority
Auto-save toggle for Monaco editor changes, default priority for newly created rules.

### T119 – Cache Management section: size display, clear/re-fetch buttons
Display cache size and node count, buttons to clear all cached data or re-fetch all nodes from Figma API.

### T120 – "Clear All Cache" button: confirmation, delete figma-data/
Clear cache button with confirmation dialog, deletes all `figma-data/` files and resets library index.

### T121 – Appearance section: theme selector (Light, Dark, System)
Theme selector with three options, updates ui-store.theme and applies to entire app.

### T122 – Theme switching: update ui-store, apply via Context Provider
Theme provider wraps app with selected theme, supports light/dark/system modes.

### T123 – Test Settings flow: change token, theme, clear cache, verify persistence
End-to-end testing of settings functionality and persistence across sessions.

## Implementation Notes

- Settings stored in localStorage (UI preferences) and .env.local (Figma token - server-side only)
- Theme: Use Next.js `next-themes` provider with Shadcn/ui theming
- Cache management: API route to delete figma-data/ directory
- Auto-save: Stored in localStorage, applied in Monaco Editor component (WP11)
- Success Criteria SC-013: Offline mode verified by disabling network after imports

## Definition of Done

- [ ] `app/settings/page.tsx` created with 5 sections
- [ ] Figma API section: masked token input, show/hide toggle, test connection
- [ ] Export Preferences section: framework, language, formatting dropdowns
- [ ] Rule Editor section: auto-save toggle, default priority input
- [ ] Cache Management section: size display, clear/re-fetch buttons
- [ ] Appearance section: theme selector with Light/Dark/System
- [ ] Theme switching works: updates UI immediately
- [ ] Settings persist in localStorage across sessions
- [ ] "Test Connection" validates Figma token
- [ ] "Clear Cache" deletes all data with confirmation
- [ ] User Story 6 (Settings) fully implemented

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
