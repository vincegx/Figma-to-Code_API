#!/usr/bin/env npx tsx
/**
 * Export generated code for a specific node
 * Usage: npx tsx scripts/export-node.ts <nodeId>
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

const nodeId = process.argv[2];
if (!nodeId) {
  console.error('Usage: npx tsx scripts/export-node.ts <nodeId>');
  console.error('Example: npx tsx scripts/export-node.ts 6055-2872');
  process.exit(1);
}

// Load Figma data from figma-data folder
const dataPath = join(__dirname, `../figma-data/${nodeId}/data.json`);
if (!existsSync(dataPath)) {
  console.error(`❌ Data not found: ${dataPath}`);
  process.exit(1);
}

const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Load rules
const officialRulesPath = join(__dirname, '../figma-data/rules/official-figma-rules.json');
const communityRulesPath = join(__dirname, '../figma-data/rules/community-rules.json');

const officialRules: MultiFrameworkRule[] = JSON.parse(readFileSync(officialRulesPath, 'utf-8'));
const communityRules: MultiFrameworkRule[] = JSON.parse(readFileSync(communityRulesPath, 'utf-8'));
const allRules = [...officialRules, ...communityRules];

console.log(`Exporting node ${nodeId} with ${allRules.length} rules\n`);

// Transform to AltNode
const altNode = transformToAltNode(figmaData);
if (!altNode) {
  console.error('❌ Failed to transform');
  process.exit(1);
}

// Generate React/Tailwind code
async function main() {
  const props = evaluateMultiFrameworkRules(altNode, allRules, 'react-tailwind');
  const result = await generateReactTailwind(altNode, props.properties, allRules, 'react-tailwind', undefined, undefined, `lib-${nodeId}`);

  // Output to console
  console.log('=== Generated React/Tailwind Code ===\n');
  console.log(result.code);

  // Also save to file in figmaMCP folder for comparison
  const outputPath = `/tmp/generated-${nodeId}.tsx`;
  writeFileSync(outputPath, result.code);
  console.log(`\n✅ Saved to ${outputPath}`);
}

main().catch(console.error);
