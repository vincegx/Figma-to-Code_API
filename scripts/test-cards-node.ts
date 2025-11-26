#!/usr/bin/env npx tsx
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

const targetId = 'I124:21154;114:861';
const cardsNode = findNodeById(figmaData, targetId);

if (!cardsNode) {
  console.error(`❌ Node ${targetId} not found`);
  process.exit(1);
}

console.log(`Found node: ${cardsNode.name} (${cardsNode.type})`);
console.log(`ID: ${cardsNode.id}\n`);

// Transform to AltNode
const altNode = transformToAltNode(cardsNode);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

console.log('=== HTML/CSS Generation ===\n');
const htmlCssProps = evaluateMultiFrameworkRules(altNode, allRules, 'html-css');
console.log('Matched rules:', Object.keys(htmlCssProps.provenance).length);
console.log('Properties:', Object.keys(htmlCssProps.properties));
console.log('');

const htmlCss = generateHTMLCSS(altNode, htmlCssProps.properties, allRules, 'html-css');
console.log('Generated HTML/CSS (first 2000 chars):');
console.log(htmlCss.code.substring(0, 2000));
console.log('...\n');

console.log('=== React Tailwind Generation ===\n');
const reactProps = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
console.log('Matched rules:', Object.keys(reactProps.provenance).length);
console.log('Properties:', Object.keys(reactProps.properties));
console.log('');

const reactTailwind = generateReactTailwind(altNode, reactProps.properties, allRules, 'react-tailwind');
console.log('Generated React Tailwind (first 2000 chars):');
console.log(reactTailwind.code.substring(0, 2000));
console.log('...\n');
