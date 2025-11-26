#!/usr/bin/env npx tsx
/**
 * Complete test: Verify BOTH html-css AND react-tailwind generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
import { generateHTMLCSS } from '../lib/code-generators/html-css';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

// Load Figma data
const dataPath = join(__dirname, '../figma-data/124-21142/data.json');
const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Load rules
const officialRulesPath = join(__dirname, '../figma-data/rules/official-figma-rules.json');
const communityRulesPath = join(__dirname, '../figma-data/rules/community-rules.json');

const officialRules: MultiFrameworkRule[] = JSON.parse(readFileSync(officialRulesPath, 'utf-8'));
const communityRules: MultiFrameworkRule[] = JSON.parse(readFileSync(communityRulesPath, 'utf-8'));
const allRules = [...officialRules, ...communityRules];

console.log(`Testing with ${allRules.length} rules\n`);

// Find slideshowTabs
function findNode(node: any, name: string): any {
  if (node.name === name) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, name);
      if (found) return found;
    }
  }
  return null;
}

const slideshowTabs = findNode(figmaData, 'slideshowTabs');
if (!slideshowTabs) {
  console.error('❌ slideshowTabs not found');
  process.exit(1);
}

// Transform to AltNode
const altNode = transformToAltNode(slideshowTabs);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

console.log('=== Testing HTML/CSS Generation ===\n');
// Generate complete HTML/CSS (this recursively processes all children)
const htmlCssProps = evaluateMultiFrameworkRules(altNode, allRules, 'html-css');
const htmlCss = generateHTMLCSS(altNode, htmlCssProps.properties, allRules, 'html-css');

console.log('Generated HTML/CSS length:', htmlCss.code.length, 'characters\n');

// Check HTML/CSS properties in the COMPLETE generated output
const issues: string[] = [];

// Check for gap property
if (!htmlCss.code.includes('gap:')) {
  issues.push('HTML/CSS: gap property missing');
} else {
  console.log('✅ HTML/CSS: gap property present');
}

// Check for opacity
if (!htmlCss.code.includes('opacity:')) {
  issues.push('HTML/CSS: opacity property missing');
} else {
  console.log('✅ HTML/CSS: opacity property present');
}

// Check for font-weight
if (!htmlCss.code.includes('font-weight:')) {
  issues.push('HTML/CSS: font-weight property missing');
} else {
  console.log('✅ HTML/CSS: font-weight property present');
}

// Check for text-transform
if (!htmlCss.code.includes('text-transform:')) {
  issues.push('HTML/CSS: text-transform property missing');
} else {
  console.log('✅ HTML/CSS: text-transform property present');
}

// Check for border-radius
if (!htmlCss.code.includes('border-radius:')) {
  issues.push('HTML/CSS: border-radius property missing');
} else {
  console.log('✅ HTML/CSS: border-radius property present');
}

// Check for letter-spacing
if (!htmlCss.code.includes('letter-spacing:')) {
  issues.push('HTML/CSS: letter-spacing property missing');
} else {
  console.log('✅ HTML/CSS: letter-spacing property present');
}

// Check for invalid properties
if (htmlCss.code.includes('normal:') || htmlCss.code.includes('NORMAL:')) {
  issues.push('HTML/CSS: Invalid "normal:" property present');
} else {
  console.log('✅ HTML/CSS: No invalid "normal:" property');
}

console.log('\n=== Testing React Tailwind Generation ===\n');
// Generate complete React Tailwind (this recursively processes all children)
const reactTailwindProps = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
const reactTailwind = generateReactTailwind(altNode, reactTailwindProps.properties, allRules, 'react-tailwind');

console.log('Generated React Tailwind length:', reactTailwind.code.length, 'characters\n');

// Check React Tailwind classes in the COMPLETE generated output
if (!reactTailwind.code.includes('gap-[')) {
  issues.push('React Tailwind: gap-[] class missing');
} else {
  console.log('✅ React Tailwind: gap-[] class present');
}

if (!reactTailwind.code.includes('opacity-[')) {
  issues.push('React Tailwind: opacity-[] class missing');
} else {
  console.log('✅ React Tailwind: opacity-[] class present');
}

if (!reactTailwind.code.includes('font-[')) {
  issues.push('React Tailwind: font-[] class missing');
} else {
  console.log('✅ React Tailwind: font-[] class present');
}

if (!reactTailwind.code.includes('uppercase')) {
  issues.push('React Tailwind: uppercase class missing');
} else {
  console.log('✅ React Tailwind: uppercase class present');
}

if (!reactTailwind.code.includes('rounded-[')) {
  issues.push('React Tailwind: rounded-[] class missing');
} else {
  console.log('✅ React Tailwind: rounded-[] class present');
}

if (!reactTailwind.code.includes('tracking-[')) {
  issues.push('React Tailwind: tracking-[] (letter-spacing) class missing');
} else {
  console.log('✅ React Tailwind: tracking-[] class present');
}

// Check for invalid classes
if (reactTailwind.code.includes('[NORMAL:') || reactTailwind.code.includes('normal:')) {
  issues.push('React Tailwind: Invalid NORMAL class present');
} else {
  console.log('✅ React Tailwind: No invalid NORMAL class');
}

// Summary
console.log('\n=== SUMMARY ===');
if (issues.length === 0) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log(`❌ ${issues.length} issues found:`);
  issues.forEach(issue => console.log(`  - ${issue}`));
  process.exit(1);
}
