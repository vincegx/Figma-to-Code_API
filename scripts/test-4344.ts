#!/usr/bin/env npx tsx
import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode, resetNameCounters } from '../lib/altnode-transform';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { evaluateMultiFrameworkRules } from '../lib/rule-engine';
import type { MultiFrameworkRule } from '../lib/types/rules';

const dataPath = join(__dirname, '../figma-data/425-4344/data.json');
const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));

const officialRulesPath = join(__dirname, '../figma-data/rules/official-figma-rules.json');
const communityRulesPath = join(__dirname, '../figma-data/rules/community-rules.json');

const officialRules: MultiFrameworkRule[] = JSON.parse(readFileSync(officialRulesPath, 'utf-8'));
const communityRules: MultiFrameworkRule[] = JSON.parse(readFileSync(communityRulesPath, 'utf-8'));
const allRules = [...officialRules, ...communityRules];

resetNameCounters();
const altNode = transformToAltNode(figmaData);

async function main() {
  const reactProps = evaluateMultiFrameworkRules(altNode!, allRules, 'react-tailwind');
  const result = await generateReactTailwind(
    altNode!,
    reactProps.properties,
    allRules,
    'react-tailwind',
    undefined,
    undefined,
    'lib-425-4344'
  );
  
  const lines = result.code.split('\n');
  for (const line of lines) {
    if (line.includes('2540:351642;2540:351358')) {
      console.log(line.trim());
    }
  }
}

main().catch(console.error);
