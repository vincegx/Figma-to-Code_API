#!/usr/bin/env npx tsx
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
import { generateHTMLCSS } from '../lib/code-generators/html-css';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

// Load Figma data
const dataPath = join(__dirname, '../figma-data/268-3339/data.json');
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

const targetId = '268:3343';
const section3Node = findNodeById(figmaData, targetId);

if (!section3Node) {
  console.error(`❌ Node ${targetId} not found`);
  process.exit(1);
}

console.log(`Found node: ${section3Node.name} (${section3Node.type})`);
console.log(`ID: ${section3Node.id}\n`);

// Transform to AltNode
const altNode = transformToAltNode(section3Node);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

console.log('=== React Tailwind Generation ===\n');
const reactProps = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
const reactTailwind = generateReactTailwind(altNode, reactProps.properties, allRules, 'react-tailwind');

console.log('Generated React Tailwind (first 3000 chars):');
console.log(reactTailwind.code.substring(0, 3000));
console.log('...\n');
