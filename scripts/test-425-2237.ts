#!/usr/bin/env npx tsx
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode, resetNameCounters } from '../lib/altnode-transform';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

// Load Figma data
const dataPath = join(__dirname, '../figma-data/425-2237/data.json');
const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Load rules
const officialRulesPath = join(__dirname, '../figma-data/rules/official-figma-rules.json');
const communityRulesPath = join(__dirname, '../figma-data/rules/community-rules.json');

const officialRules: MultiFrameworkRule[] = JSON.parse(readFileSync(officialRulesPath, 'utf-8'));
const communityRules: MultiFrameworkRule[] = JSON.parse(readFileSync(communityRulesPath, 'utf-8'));
const allRules = [...officialRules, ...communityRules];

console.log(`Loaded ${allRules.length} rules\n`);

// Find node by ID or path
function findNodeById(node: any, id: string): any {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Find node by name
function findNodeByName(node: any, name: string): any {
  if (node.name === name) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

console.log('=== Testing node 425:2237 ===\n');

// Transform root node
resetNameCounters();
const altNode = transformToAltNode(figmaData);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

console.log(`Transformed: ${altNode.name} (${altNode.originalType})`);
console.log(`Children: ${altNode.children.length}\n`);

// Check for negative itemSpacing handling
function checkNegativeSpacing(node: any, depth: number = 0): void {
  const indent = '  '.repeat(depth);
  if (node.negativeItemSpacing !== undefined) {
    console.log(`${indent}📦 ${node.name}: negativeItemSpacing=${node.negativeItemSpacing}, direction=${node.layoutDirection}`);
  }
  if (node.children) {
    for (const child of node.children) {
      checkNegativeSpacing(child, depth + 1);
    }
  }
}

console.log('=== Checking negative itemSpacing handling ===\n');
checkNegativeSpacing(altNode);
console.log('');

// Generate code
async function main() {
  console.log('=== Generating React Tailwind ===\n');
  const reactProps = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
  const reactTailwind = await generateReactTailwind(
    altNode,
    reactProps.properties,
    allRules,
    'react-tailwind',
    undefined,
    undefined,
    'lib-425-2237'
  );

  // Output full code
  console.log(reactTailwind.code);
  console.log('\n=== Done ===');
}

main().catch(console.error);
