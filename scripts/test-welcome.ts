#!/usr/bin/env npx tsx
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

// Load Figma data
const dataPath = join(__dirname, '../figma-data/354-16054/data.json');
const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Load rules
const officialRulesPath = join(__dirname, '../figma-data/rules/official-figma-rules.json');
const communityRulesPath = join(__dirname, '../figma-data/rules/community-rules.json');

const officialRules: MultiFrameworkRule[] = JSON.parse(readFileSync(officialRulesPath, 'utf-8'));
const communityRules: MultiFrameworkRule[] = JSON.parse(readFileSync(communityRulesPath, 'utf-8'));
const allRules = [...officialRules, ...communityRules];

// Find node by ID
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

const targetId = '354:16054';
const welcomeNode = findNodeById(figmaData, targetId);

if (!welcomeNode) {
  console.error(`❌ Node ${targetId} not found`);
  process.exit(1);
}

console.log(`Found node: ${welcomeNode.name} (${welcomeNode.type})`);
console.log(`ID: ${welcomeNode.id}\n`);

// Transform to AltNode
const altNode = transformToAltNode(welcomeNode);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

console.log('=== React Tailwind Generation ===\n');
const reactProps = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
const reactTailwind = generateReactTailwind(altNode, reactProps.properties, allRules, 'react-tailwind');

console.log('Generated React Tailwind:');
console.log(reactTailwind.code);
console.log('\n');
