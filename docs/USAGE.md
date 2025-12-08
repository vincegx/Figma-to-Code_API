# Usage Guide

Learn how to use Figma Code Export to transform your designs into code.

## Table of Contents

- [Overview](#overview)
- [Importing Nodes](#importing-nodes)
- [Node Library](#node-library)
- [Node Viewer](#node-viewer)
- [Exporting Code](#exporting-code)
- [Responsive Merge](#responsive-merge)
- [Rules Engine](#rules-engine)

---

## Overview

### Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Import    │ →  │   Preview   │ →  │  Customize  │ →  │   Export    │
│  from Figma │    │  & Inspect  │    │   (Rules)   │    │    Code     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Overview, recent imports, quick actions |
| Nodes | `/nodes` | Browse and manage imported nodes |
| Viewer | `/node/[id]` | Inspect node, preview, export code |
| Merges | `/merges` | Browse responsive merges |
| Merge Viewer | `/merge/[id]` | Preview and export merged component |
| Rules | `/rules` | Manage transformation rules |
| Settings | `/settings` | API config, preferences |

---

## Importing Nodes

### Step 1: Get the Figma URL

1. Open your Figma file
2. Select the frame/component you want to export
3. Copy the URL from your browser

The URL should look like:
```
https://www.figma.com/file/ABC123/MyFile?node-id=123:456
```

### Step 2: Import

1. Go to Dashboard or click **Import** in the sidebar
2. Paste the Figma URL
3. Click **Import**

The import process:
1. Fetches the node tree from Figma API
2. Downloads images and icons
3. Transforms to internal format
4. Saves to local storage

### What Gets Imported

- ✅ Full node tree (frames, groups, components)
- ✅ Styles (colors, typography, effects)
- ✅ Auto-layout properties
- ✅ Images (as base64 or downloaded)
- ✅ Icons/vectors (as SVG)
- ✅ Component instances

---

## Node Library

### Grid View

Browse your imported nodes as visual cards showing:
- Thumbnail preview
- Node name
- Import date
- Quick actions

### List View

Table view with sortable columns:
- Name
- Type (Frame, Component, etc.)
- Date imported
- Size

### Filtering & Search

- **Search:** Filter by name
- **Type:** Frame, Component, Instance, Group
- **Sort:** Name, Date, Size

### Actions

- **Open:** View in Node Viewer
- **Refresh:** Re-fetch from Figma API
- **Delete:** Remove from library

---

## Node Viewer

The main workspace for inspecting and exporting nodes.

### Layout

```
┌────────────────────────────────────────────────────────┐
│  Header: Node name, framework selector, actions        │
├────────────────────────────────────────────────────────┤
│                    │                                   │
│   Tree Navigator   │        Live Preview               │
│   (Node hierarchy) │        (Rendered output)          │
│                    │                                   │
├────────────────────┼───────────────────────────────────┤
│                    │                                   │
│   Node Properties  │        Generated Code             │
│   (Styles, layout) │        (Copy/Download)            │
│                    │                                   │
└────────────────────┴───────────────────────────────────┘
```

### Tree Navigator

- Click nodes to select them
- View hierarchy structure
- See node types (icons)
- Identify auto-layout containers

### Live Preview

- Real-time rendered output
- Breakpoint simulation (resize)
- Hover to highlight elements

### Code Panel

- Syntax-highlighted code
- Framework selector (React/Tailwind, HTML/CSS)
- Copy to clipboard
- Download as file

---

## Exporting Code

### Available Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| React + Tailwind | `.tsx` | JSX with Tailwind utility classes |
| React + Tailwind v4 | `.tsx` | JSX with Tailwind v4 syntax |
| HTML + CSS | `.html` + `.css` | Semantic HTML with external CSS |

### Export Options

1. **Copy:** Copy code to clipboard
2. **Download:** Save as file(s)
3. **Export All:** Download complete package (ZIP)

### Code Quality

The generated code follows best practices:
- Semantic HTML elements
- Accessible attributes (alt, aria)
- Clean class names
- Proper indentation
- No inline styles (Tailwind) or external CSS (HTML)

---

## Responsive Merge

### What is Responsive Merge?

Combine 3 Figma frames (mobile, tablet, desktop) into a single responsive component with automatic Tailwind breakpoint classes.

### Creating a Merge

#### Step 1: Import Your Breakpoints

Import 3 frames from Figma:
- Mobile (e.g., 375px width)
- Tablet (e.g., 768px width)
- Desktop (e.g., 1280px width)

> **Tip:** Name your layers consistently across breakpoints for better matching.

#### Step 2: Create New Merge

1. Go to **Merges** page
2. Click **New Merge**
3. Enter a name for your merge
4. Select 3 nodes and assign breakpoints:
   - Node A → Mobile
   - Node B → Tablet
   - Node C → Desktop

#### Step 3: Review & Export

The merge viewer shows:
- Unified component tree
- Breakpoint toggle (preview at each size)
- Generated responsive code
- Warnings for unmatched elements

### How Matching Works

Elements are matched by **layer name** across breakpoints:

```
Mobile          Tablet          Desktop         Result
─────────────────────────────────────────────────────────
"Hero"     →    "Hero"     →    "Hero"     →   Matched ✓
"Title"    →    "Title"    →    "Title"    →   Matched ✓
"CTA"      →    "CTA"      →    (missing)  →   Mobile/Tablet only
(missing)  →    (missing)  →    "Sidebar"  →   Desktop only
```

### Generated Classes

The algorithm generates mobile-first Tailwind classes:

```jsx
// Style differences become responsive classes
className="
  p-4        // Mobile base
  md:p-6     // Tablet override
  lg:p-8     // Desktop override
"

// Visibility for breakpoint-specific elements
className="hidden lg:block"  // Desktop only
className="block md:hidden"  // Mobile only
```

### Best Practices

1. **Consistent naming:** Use identical layer names across breakpoints
2. **Same structure:** Keep the component hierarchy similar
3. **Design tokens:** Use consistent spacing/colors for cleaner output
4. **Test each breakpoint:** Preview at all sizes before exporting

---

## Rules Engine

### What Are Rules?

Rules customize how Figma properties transform into code. They let you:
- Map Figma styles to custom classes
- Override default transformations
- Add project-specific utilities

### Default Rules

The app comes with sensible defaults:
- Figma colors → Tailwind color classes
- Auto-layout → Flexbox utilities
- Typography → Text utilities
- Spacing → Padding/margin utilities

### Custom Rules

Create rules for your design system:

```json
{
  "name": "Brand Primary",
  "match": {
    "property": "fills",
    "value": "#FF5733"
  },
  "output": {
    "class": "bg-brand-primary"
  }
}
```

### Rule Priority

1. Custom rules (highest priority)
2. Project rules
3. Default rules (lowest priority)

### Managing Rules

Go to **Rules** page to:
- View all active rules
- Create new rules
- Edit existing rules
- Enable/disable rules
- Import/export rule sets

---

## Tips & Tricks

### For Better Output

1. **Use Auto-Layout:** Figma auto-layout translates to clean flexbox
2. **Name your layers:** Meaningful names = readable code
3. **Use components:** Figma components become reusable code
4. **Consistent spacing:** Use 4px/8px grid for Tailwind-friendly values

### For Faster Workflow

1. **Keyboard shortcuts:** `Cmd/Ctrl + C` to copy code
2. **Quick import:** Paste URL directly on dashboard
3. **Favorites:** Star frequently used nodes
4. **Recent:** Dashboard shows last imported nodes

---

## Next Steps

- [Technical Documentation](TECHNICAL.md) — Architecture and APIs
- [FAQ](FAQ.md) — Common questions
- [Back to README](../README.md)
