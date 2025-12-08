# Installation Guide

Complete setup guide for Figma Code Export.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Figma API Token](#figma-api-token)
- [Running the App](#running-the-app)
- [Troubleshooting](#troubleshooting)

---

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | [Download](https://nodejs.org/) |
| npm | 9+ | Comes with Node.js |
| Figma Account | Free or Pro | For API access |

### Check your versions

```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

---

## Installation

### Option 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/vincegx/Figma-Code-Export.git

# Navigate to the project
cd Figma-Code-Export

# Install dependencies
npm install
```

### Option 2: Download ZIP

1. Go to [Releases](https://github.com/vincegx/Figma-Code-Export/releases)
2. Download the latest release
3. Extract and run `npm install`

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required: Your Figma personal access token
FIGMA_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Custom port (default: 3000)
PORT=3000
```

### File Structure After Setup

```
Figma-Code-Export/
├── .env.local          ← Your config (gitignored)
├── figma-data/         ← Imported nodes (gitignored)
│   ├── rules/          ← Transformation rules
│   └── [node-folders]  ← Your imported Figma nodes
├── merges-data/        ← Saved merges (gitignored)
└── ...
```

---

## Figma API Token

### Step 1: Go to Figma Settings

1. Open [figma.com](https://figma.com) and log in
2. Click your profile picture (top-right)
3. Select **Settings**

### Step 2: Generate Token

1. Scroll to **Personal Access Tokens**
2. Click **Generate new token**
3. Give it a name (e.g., "Figma Code Export")
4. Copy the token immediately (you won't see it again!)

### Step 3: Add to Config

Paste your token in `.env.local`:

```env
FIGMA_ACCESS_TOKEN=figd_your_token_here
```

### Token Permissions

The token needs access to:
- ✅ Read files you have access to
- ✅ Read file versions
- ✅ Export images

> **Note:** The token inherits your Figma account permissions. You can only import files you have view access to.

---

## Running the App

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Features:
- Hot reload on code changes
- Detailed error messages
- Source maps for debugging

### Production Mode

```bash
# Build the app
npm run build

# Start production server
npm start
```

Production mode is faster but doesn't hot reload.

---

## Troubleshooting

### "FIGMA_ACCESS_TOKEN is not defined"

**Cause:** Missing or incorrectly named environment file.

**Fix:**
```bash
# Make sure .env.local exists
ls -la .env.local

# If missing, create it
cp .env.local.example .env.local
```

### "Invalid token" or 403 errors

**Cause:** Token is expired, revoked, or incorrectly copied.

**Fix:**
1. Go to Figma Settings → Personal Access Tokens
2. Revoke the old token
3. Generate a new one
4. Update `.env.local`
5. Restart the dev server

### "Cannot access file" errors

**Cause:** You don't have permission to view the Figma file.

**Fix:**
- Make sure you have at least "View" access to the file
- Ask the file owner to share it with you

### Port already in use

**Cause:** Another app is using port 3000.

**Fix:**
```bash
# Use a different port
PORT=3001 npm run dev

# Or kill the process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Node modules issues

**Cause:** Corrupted or outdated dependencies.

**Fix:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

- [Usage Guide](USAGE.md) — Learn how to import and export
- [Technical Docs](TECHNICAL.md) — Understand the architecture
- [FAQ](FAQ.md) — Common questions

---

[← Back to README](../README.md)
