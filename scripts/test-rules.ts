#!/usr/bin/env npx tsx
/**
 * Test script to verify rule matching works correctly
 *
 * Usage: npx tsx scripts/test-rules.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
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

console.log(`Loaded ${officialRules.length} official rules + ${communityRules.length} community rules = ${allRules.length} total\n`);

// Find the Tab node
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

const tabNode = findNode(figmaData, 'Tab');
const tabTitleNode = findNode(figmaData, 'Tab titleleft');
const imageNode = findNode(figmaData, 'image');

if (!tabNode) {
  console.error('❌ Tab node not found');
  process.exit(1);
}

if (!tabTitleNode) {
  console.error('❌ Tab titleleft node not found');
  process.exit(1);
}

if (!imageNode) {
  console.error('❌ image node not found');
  process.exit(1);
}

console.log('=== Testing Tab node ===');
console.log(`Type: ${tabNode.type}`);
console.log(`itemSpacing: ${tabNode.itemSpacing}`);
console.log(`paddingLeft: ${tabNode.paddingLeft}`);
console.log(`paddingRight: ${tabNode.paddingRight}\n`);

// Transform to AltNode
const tabAltNode = transformToAltNode(tabNode);

console.log('=== Tab AltNode ===');
console.log(`originalType: ${tabAltNode.originalType}`);
console.log(`originalNode.itemSpacing: ${(tabAltNode.originalNode as any)?.itemSpacing}\n`);

// Evaluate rules for html-css (easier to verify individual properties)
const tabResult = evaluateMultiFrameworkRules(tabAltNode, allRules, 'html-css');

console.log('=== Tab Matching Rules (html-css) ===');
const matchedRuleIds = Object.values(tabResult.provenance);
console.log(`Total matches: ${matchedRuleIds.length}`);
console.log(`Unique rules: ${new Set(matchedRuleIds).size}`);

const itemSpacingRules = matchedRuleIds.filter(r => r.includes('itemspacing') || r.includes('gap'));
console.log(`\nitemSpacing/gap rules: ${itemSpacingRules.length}`);
itemSpacingRules.forEach(r => console.log(`  - ${r}`));

console.log('\n=== Tab Resolved Properties ===');
console.log(`All properties: ${JSON.stringify(tabResult.properties, null, 2)}`);
console.log(`All provenance: ${JSON.stringify(tabResult.provenance, null, 2)}`);

// For html-css, gap should be a direct property
if (tabResult.properties.gap) {
  console.log(`✅ gap: ${tabResult.properties.gap}`);
} else {
  console.log(`❌ gap: MISSING (expected from itemSpacing: ${tabNode.itemSpacing})`);
}

console.log('\n\n=== Testing Tab titleleft node ===');
console.log(`Type: ${tabTitleNode.type}`);
console.log(`opacity: ${tabTitleNode.opacity}`);
console.log(`fontWeight: ${tabTitleNode.style?.fontWeight}`);
console.log(`textCase: ${tabTitleNode.style?.textCase}\n`);

// Transform to AltNode
const tabTitleAltNode = transformToAltNode(tabTitleNode);

console.log('=== Tab titleleft AltNode ===');
console.log(`originalType: ${tabTitleAltNode.originalType}`);
console.log(`originalNode.opacity: ${(tabTitleAltNode.originalNode as any)?.opacity}\n`);

// Evaluate rules for html-css
const tabTitleResult = evaluateMultiFrameworkRules(tabTitleAltNode, allRules, 'html-css');

console.log('=== Tab titleleft Matching Rules (html-css) ===');
const tabTitleRuleIds = Object.values(tabTitleResult.provenance);
console.log(`Total matches: ${tabTitleRuleIds.length}`);
console.log(`Unique rules: ${new Set(tabTitleRuleIds).size}`);

const opacityRules = tabTitleRuleIds.filter(r => r.includes('opacity'));
console.log(`\nopacity rules: ${opacityRules.length}`);
opacityRules.forEach(r => console.log(`  - ${r}`));

const fontWeightRules = tabTitleRuleIds.filter(r => r.includes('weight'));
console.log(`\nfontWeight rules: ${fontWeightRules.length}`);
fontWeightRules.forEach(r => console.log(`  - ${r}`));

console.log('\n=== Tab titleleft Resolved Properties ===');
if (tabTitleResult.properties.opacity) {
  console.log(`✅ opacity: ${tabTitleResult.properties.opacity}`);
} else {
  console.log(`❌ opacity: MISSING (expected: ${tabTitleNode.opacity})`);
}

if (tabTitleResult.properties['font-weight'] || tabTitleResult.properties.fontWeight) {
  console.log(`✅ font-weight: ${tabTitleResult.properties['font-weight'] || tabTitleResult.properties.fontWeight}`);
} else {
  console.log(`❌ font-weight: MISSING (expected: ${tabTitleNode.style?.fontWeight})`);
}

if (tabTitleResult.properties['text-transform'] || tabTitleResult.properties.textTransform) {
  console.log(`✅ text-transform: ${tabTitleResult.properties['text-transform'] || tabTitleResult.properties.textTransform}`);
} else {
  console.log(`❌ text-transform: MISSING (expected from textCase: ${tabTitleNode.style?.textCase})`);
}

console.log('\n\n=== Testing image node ===');
console.log(`Type: ${imageNode.type}`);
console.log(`opacity: ${imageNode.opacity}`);
console.log(`cornerRadius: ${imageNode.cornerRadius}\n`);

// Transform to AltNode
const imageAltNode = transformToAltNode(imageNode);

// Evaluate rules for html-css
const imageResult = evaluateMultiFrameworkRules(imageAltNode, allRules, 'html-css');

console.log('=== image Resolved Properties ===');
if (imageResult.properties.opacity) {
  console.log(`✅ opacity: ${imageResult.properties.opacity}`);
} else {
  console.log(`❌ opacity: MISSING (expected: ${imageNode.opacity})`);
}

if (imageResult.properties['border-radius'] || imageResult.properties.borderRadius) {
  console.log(`✅ border-radius: ${imageResult.properties['border-radius'] || imageResult.properties.borderRadius}`);
} else {
  console.log(`❌ border-radius: MISSING (expected: ${imageNode.cornerRadius})`);
}

// Summary
console.log('\n\n=== SUMMARY ===');
const issues = [];
if (!tabResult.properties.gap) issues.push('Tab: gap missing');
if (!tabTitleResult.properties.opacity) issues.push('Tab titleleft: opacity missing');
if (!tabTitleResult.properties['font-weight'] && !tabTitleResult.properties.fontWeight) issues.push('Tab titleleft: font-weight missing');
if (!tabTitleResult.properties['text-transform'] && !tabTitleResult.properties.textTransform) issues.push('Tab titleleft: text-transform missing');
if (!imageResult.properties.opacity) issues.push('image: opacity missing');
if (!imageResult.properties['border-radius'] && !imageResult.properties.borderRadius) issues.push('image: border-radius missing');

if (issues.length === 0) {
  console.log('✅ All properties generated correctly!');
} else {
  console.log(`❌ ${issues.length} issues found:`);
  issues.forEach(issue => console.log(`  - ${issue}`));
  process.exit(1);
}
