#!/usr/bin/env node

/**
 * Generate a full Tailwind CSS build for iframe preview
 * This includes all utility classes without JIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '../public/preview-libs');
const TAILWIND_INPUT = path.join(__dirname, 'tailwind-full-input.css');
const TAILWIND_OUTPUT = path.join(ASSETS_DIR, 'tailwind.css');

// Create assets directory
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Create temporary input CSS with all Tailwind directives
const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

fs.writeFileSync(TAILWIND_INPUT, inputCSS);

console.log('🎨 Generating full Tailwind CSS build...');

try {
  // Generate full CSS (without purge/JIT for maximum compatibility)
  execSync(
    `npx tailwindcss -i ${TAILWIND_INPUT} -o ${TAILWIND_OUTPUT} --minify`,
    { stdio: 'inherit' }
  );

  // Clean up temp file
  fs.unlinkSync(TAILWIND_INPUT);

  const sizeKB = (fs.statSync(TAILWIND_OUTPUT).size / 1024).toFixed(2);
  console.log(`✓ Tailwind CSS generated (${sizeKB} KB)`);
} catch (error) {
  console.error('✗ Failed to generate Tailwind CSS:', error.message);
  process.exit(1);
}
