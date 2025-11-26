#!/usr/bin/env node

/**
 * Copy React and dependencies to /public for iframe live preview
 * Run this during build or dev setup
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../public/preview-libs');
const NODE_MODULES = path.join(__dirname, '../node_modules');

// Create assets directory
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Copy React UMD builds
const assets = [
  {
    src: 'react/umd/react.development.js',
    dest: 'react.js',
  },
  {
    src: 'react-dom/umd/react-dom.development.js',
    dest: 'react-dom.js',
  },
];

console.log('📦 Copying preview assets to /public...');

assets.forEach(({ src, dest }) => {
  const srcPath = path.join(NODE_MODULES, src);
  const destPath = path.join(ASSETS_DIR, dest);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${src} → ${dest}`);
  } else {
    console.error(`✗ Not found: ${src}`);
    process.exit(1);
  }
});

console.log('✓ Preview assets ready!');
