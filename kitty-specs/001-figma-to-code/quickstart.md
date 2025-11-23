# Quickstart: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/quickstart.md](kitty-specs/001-figma-to-code/quickstart.md)*

**Feature**: 001-figma-to-code
**Date**: 2025-11-23
**Purpose**: Get started with the Figma-to-Code Rule Builder in under 5 minutes

---

## Prerequisites

- **Node.js** 18+ installed
- **Figma account** with access to design files
- **Figma Personal Access Token** ([create one here](https://www.figma.com/developers/api#access-tokens))
- **Modern browser** (Chrome, Firefox, or Safari latest version)

---

## Setup (One-Time)

### 1. Clone & Install

```bash
git clone <repository-url>
cd figma-rules-builder
npm install
```

### 2. Configure Figma Access Token

Create `.env.local` file in project root:

```bash
# .env.local
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

**How to get your token**:
1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Create new token"
4. Give it a name (e.g., "Rule Builder Dev")
5. Copy the token and paste it into `.env.local`

⚠️ **Security**: Never commit `.env.local` to git (it's already in `.gitignore`)

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## First Use: Load a Figma Node

### 1. Get Figma File URL & Node ID

Open your Figma file in the browser. The URL looks like:
```
https://www.figma.com/file/ABC123/Design-File?node-id=456:789
```

- **File Key**: `ABC123` (between `/file/` and `/`)
- **Node ID**: `456:789` (after `node-id=`, URL-encoded as `456%3A789`)

### 2. Fetch the Node

In the Rule Builder app:

1. Paste the Figma file URL into the input field
2. Enter the node ID (e.g., `456:789`)
3. Click "Fetch Node"

**What happens**:
- App calls Figma REST API via Next.js API route (`/api/figma/fetch`)
- Downloads node tree, design tokens, and screenshot
- Saves to `figma-data/{node-id}.json`, `{node-id}-variables.json`, `{node-id}-screenshot.png`
- Transforms Figma JSON to AltNode representation
- Displays normalized tree in left panel

⏱ **Expected time**: 2-5 seconds (depending on node complexity)

---

## Create Your First Rule

### 1. Understanding the Interface

After fetching a node, you'll see three panels:

```
┌──────────────┬────────────────────┬──────────────────┐
│              │                    │                  │
│  Left Panel  │   Center Panel     │   Right Panel    │
│  AltNode     │   Rule Editor      │   Live Previews  │
│  Tree        │   (Monaco Editor)  │   (3 Tabs)       │
│              │                    │                  │
└──────────────┴────────────────────┴──────────────────┘
```

- **Left Panel**: Browse the AltNode tree (normalized Figma structure)
- **Center Panel**: Write mapping rules in JSON
- **Right Panel**: See generated code (React JSX, React+Tailwind, HTML/CSS)

### 2. Create a Simple Rule

In the center panel (Monaco Editor), add this rule:

```json
{
  "version": "1.0.0",
  "rules": [
    {
      "id": "rule-horizontal-layout",
      "name": "Horizontal Auto Layout → Flex Row",
      "selector": {
        "layoutMode": "horizontal"
      },
      "transformer": {
        "htmlTag": "div",
        "inlineStyles": {
          "display": "flex",
          "flexDirection": "row"
        }
      },
      "priority": 10,
      "enabled": true,
      "description": "Converts Figma horizontal auto-layout to flexbox"
    }
  ]
}
```

**What this rule does**:
- **Selector**: Matches all nodes with horizontal auto-layout
- **Transformer**: Generates `<div>` with `display: flex; flex-direction: row;`
- **Priority**: 10 (wins over rules with priority <10 on conflicts)

### 3. See Live Preview

As you type, the right panel updates within 100ms showing:

- **React JSX Tab**: React component with inline styles
- **React + Tailwind Tab**: React with Tailwind utility classes
- **HTML/CSS Tab**: Plain HTML + separate CSS file

---

## Understanding Rule Matching

### How Selectors Work

Selectors use **AND logic** - all properties must match:

```json
{
  "selector": {
    "nodeType": "container",
    "layoutMode": "horizontal",
    "hasChildren": true
  }
}
```

This matches only nodes that are:
- ✅ `nodeType: "container"` **AND**
- ✅ `layoutMode: "horizontal"` **AND**
- ✅ `hasChildren: true`

### Priority-Based Conflict Resolution

When multiple rules match the same node:

```json
[
  {
    "id": "rule-layout",
    "selector": { "layoutMode": "horizontal" },
    "transformer": { "htmlTag": "div", "inlineStyles": { "display": "flex", "gap": "16px" } },
    "priority": 10
  },
  {
    "id": "rule-button",
    "selector": { "nodeType": "container" },
    "transformer": { "htmlTag": "button", "inlineStyles": { "padding": "12px" } },
    "priority": 20
  }
]
```

**Resolution** (if both match):
- **htmlTag**: `"button"` (priority 20 wins)
- **display**: `"flex"` (no conflict, from priority 10)
- **gap**: `"16px"` (no conflict, from priority 10)
- **padding**: `"12px"` (no conflict, from priority 20)

**Result**: Properties **compose** where they don't conflict, higher priority wins on conflicts.

---

## Debugging Rules

### View Matching Rules for a Node

1. Click any node in the left panel (AltNode tree)
2. Sidebar appears showing:
   - All rules that matched this node (ordered by priority)
   - Which properties each rule contributes
   - Conflicts highlighted in yellow (minor) or red (major)

### Common Issues

| Problem | Solution |
|---|---|
| **Rule not matching** | Check selector properties match AltNode exactly (case-sensitive) |
| **Unexpected output** | Click node to see which rule won - check priority values |
| **Syntax error in editor** | Red squiggles show JSON errors - hover for details |
| **Preview not updating** | Check browser console for errors, verify rule JSON is valid |

---

## Testing Rule Generality

### Load Multiple Nodes

To verify rules work across different examples:

1. Enter a different node ID in the input field
2. Click "Fetch Node"
3. System fetches new node and applies existing rules
4. Compare preview outputs - do rules generalize?

**Example workflow**:
1. Fetch a button component (`node-id=100:200`)
2. Create rules for buttons
3. Fetch a different button variant (`node-id=100:300`)
4. Verify same rules produce correct output

---

## Saving & Loading Rules

### Save Rule Library

```bash
# Rules auto-save to mapping-rules.json
# Commit to Git for version control:
git add mapping-rules.json
git commit -m "Add horizontal layout rules"
```

### Load Existing Rules

Rule library (`mapping-rules.json`) loads automatically on app start. Edit directly in Monaco Editor or via file system.

---

## Example: Button Component Workflow

### Step 1: Fetch Button from Figma

```
URL: https://www.figma.com/file/ABC123/Design-System?node-id=10:20
Node ID: 10:20
```

### Step 2: Create Button Rules

```json
{
  "version": "1.0.0",
  "rules": [
    {
      "id": "button-container",
      "name": "Button Frame → Button Tag",
      "selector": {
        "nodeType": "container",
        "layoutMode": "horizontal"
      },
      "transformer": {
        "htmlTag": "button",
        "inlineStyles": {
          "display": "flex",
          "alignItems": "center",
          "justifyContent": "center"
        }
      },
      "priority": 20
    },
    {
      "id": "button-primary-style",
      "name": "Primary Button Styling",
      "selector": {
        "customProperties": {
          "background": "#0066FF"
        }
      },
      "transformer": {
        "htmlTag": "button",
        "cssClasses": ["btn", "btn-primary"],
        "inlineStyles": {
          "background": "#0066FF",
          "color": "#FFFFFF",
          "padding": "12px 24px",
          "borderRadius": "8px"
        }
      },
      "priority": 30
    }
  ]
}
```

### Step 3: Verify Output

**React JSX Preview**:
```jsx
export function PrimaryButton() {
  return (
    <button style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0066FF",
      color: "#FFFFFF",
      padding: "12px 24px",
      borderRadius: "8px"
    }}>
      Click me
    </button>
  );
}
```

### Step 4: Test with Other Buttons

Load secondary button (`10:21`), tertiary button (`10:22`) - verify rules adapt correctly.

---

## Next Steps

1. **Explore AltNode Properties**: Click nodes in tree to see available CSS properties
2. **Create Rule Library**: Build reusable rules for your design system
3. **Export Rules**: Share `mapping-rules.json` with team or use in production export tool
4. **Experiment**: Try different selectors, priorities, and transformers

---

## Troubleshooting

### "Invalid Figma token" error
- Check `.env.local` has correct token (starts with `figd_`)
- Verify token has access to the file (check Figma permissions)
- Token may have expired - generate a new one

### "Node not found" error
- Verify node ID format is `123:456` (colon, not URL-encoded)
- Check you have view access to the Figma file
- Node may have been deleted from Figma

### Preview not updating
- Check browser console for JavaScript errors
- Verify JSON syntax is valid (Monaco shows red squiggles if not)
- Try refreshing the page

### Slow performance (>100ms preview updates)
- Large node tree (>100 nodes) may exceed performance targets
- Consider loading smaller sub-trees
- Check browser CPU usage - close other tabs

---

## Resources

- **Figma API Docs**: https://www.figma.com/developers/api
- **Rule Schema**: See `contracts/rule-schema.json` for full JSON schema
- **AltNode Schema**: See `contracts/altnode-schema.json` for property reference
- **Source Code**: Explore `lib/` folder for transformation logic

---

## Getting Help

1. Check the troubleshooting section above
2. Review example rules in `public/examples/`
3. Open browser console for detailed error messages
4. File an issue with:
   - Figma file URL (if shareable)
   - Node ID
   - Rules JSON
   - Screenshot of error

Happy rule building! 🎨→💻
