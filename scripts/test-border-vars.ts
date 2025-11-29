#!/usr/bin/env npx tsx
/**
 * Test: Verify border CSS variable generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { transformToAltNode } from '../lib/altnode-transform';
import { generateHTMLCSS } from '../lib/code-generators/html-css';
import { generateReactTailwind } from '../lib/code-generators/react-tailwind';
import { setCachedVariablesMap } from '../lib/utils/variable-css';

async function test() {
  const dataPath = join(__dirname, '../figma-data/465-16388/data.json');
  const variablesPath = join(__dirname, '../figma-data/465-16388/variables.json');

  const figmaData = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const variables = JSON.parse(readFileSync(variablesPath, 'utf-8'));

  console.log('=== Variables loaded ===');
  console.log('Count:', Object.keys(variables).length);

  // Set the cache BEFORE generating code
  setCachedVariablesMap({
    variables,
    lastUpdated: new Date().toISOString(),
    version: 1
  });

  // Transform
  const altNode = transformToAltNode(figmaData);
  if (!altNode) {
    console.error('Failed to transform');
    process.exit(1);
  }

  // Test React-Tailwind
  console.log('\n=== REACT-TAILWIND OUTPUT ===');
  const tailwindOutput = await generateReactTailwind(altNode, {}, [], 'react-tailwind', undefined, undefined, '465-16388');

  // Find lines with border
  const tailwindLines = tailwindOutput.code.split('\n');
  const borderTailwindLines = tailwindLines.filter(l => l.includes('border'));

  console.log('Lines with "border":');
  borderTailwindLines.forEach(l => console.log(l));

  // Check for border color variable
  if (tailwindOutput.code.includes('var(--var-112-554')) {
    console.log('\n✅ var(--var-112-554) found in React-Tailwind code');
  } else {
    console.log('\n❌ var(--var-112-554) NOT found in React-Tailwind code');
  }

  // Test HTML-CSS
  console.log('\n=== HTML-CSS OUTPUT ===');
  const htmlOutput = await generateHTMLCSS(altNode, {}, [], 'html-css', undefined, undefined, '465-16388');

  const cssLines = (htmlOutput.css || '').split('\n');
  const borderCssLines = cssLines.filter(l => l.includes('border'));

  console.log('Lines with "border":');
  borderCssLines.slice(0, 10).forEach(l => console.log(l));

  if (htmlOutput.css && htmlOutput.css.includes('var(--var-112-554')) {
    console.log('\n✅ var(--var-112-554) found in HTML-CSS');
  } else {
    console.log('\n❌ var(--var-112-554) NOT found in HTML-CSS');
  }
}

test();
