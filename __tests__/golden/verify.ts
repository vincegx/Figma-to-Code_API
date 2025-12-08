/**
 * Golden Test Verify Script
 *
 * Regenerates outputs and compares against captured golden outputs.
 * Run this AFTER each refactoring step to verify no regressions.
 *
 * Usage: npx ts-node __tests__/golden/verify.ts
 *
 * Exit codes:
 *   0 = All tests pass (no diff)
 *   1 = One or more tests failed (diff detected)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { GOLDEN_NODES, FRAMEWORKS, type Framework } from './corpus';

// Import code generators
import { transformToAltNode, resetNameCounters } from '../../lib/altnode-transform';
import { setCachedVariablesMap } from '../../lib/utils/variable-css';
import { evaluateMultiFrameworkRules } from '../../lib/rule-engine';
import { generateReactTailwind } from '../../lib/code-generators/react-tailwind';
import { generateReactTailwindV4 } from '../../lib/code-generators/react-tailwind-v4';
import { generateHTMLTailwindCSS } from '../../lib/code-generators/html-tailwind-css';
import type { MultiFrameworkRule, FrameworkType } from '../../lib/types/rules';

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

/**
 * Load node data from figma-data directory
 */
async function loadNodeData(dirName: string): Promise<any> {
  const dataPath = path.join(FIGMA_DATA_DIR, dirName, 'data.json');
  const content = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load variables from figma-data directory
 */
async function loadVariables(dirName: string): Promise<Record<string, any>> {
  try {
    const varsPath = path.join(FIGMA_DATA_DIR, dirName, 'variables.json');
    const content = await fs.readFile(varsPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Load all rules from the rules directory
 */
async function loadRules(): Promise<MultiFrameworkRule[]> {
  try {
    const rulesPath = path.join(FIGMA_DATA_DIR, 'rules');
    const entries = await fs.readdir(rulesPath, { withFileTypes: true });
    const rules: MultiFrameworkRule[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const rulePath = path.join(rulesPath, entry.name);
          const content = await fs.readFile(rulePath, 'utf-8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            rules.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            rules.push(parsed);
          }
        } catch (e) {
          console.warn(`Failed to load rule ${entry.name}:`, e);
        }
      }
    }

    return rules;
  } catch {
    return [];
  }
}

/**
 * Generate code for a node with a specific framework
 */
async function generateCode(
  nodeData: any,
  variables: Record<string, any>,
  rules: MultiFrameworkRule[],
  framework: Framework,
  nodeId: string
): Promise<{ code: string; css?: string }> {
  // Reset name counters for consistent output
  resetNameCounters();

  // Set variables cache
  if (Object.keys(variables).length > 0) {
    setCachedVariablesMap({
      variables: variables as any,
      lastUpdated: new Date().toISOString(),
      version: 1
    });
  }

  // Transform to AltNode
  const altNode = transformToAltNode(nodeData, 0, undefined, undefined, variables);
  if (!altNode) {
    throw new Error('Failed to transform node');
  }

  // Evaluate rules
  const { properties: resolvedProperties } = evaluateMultiFrameworkRules(
    altNode,
    rules,
    framework as FrameworkType
  );

  // Generate code
  let result;
  if (framework === 'react-tailwind') {
    result = await generateReactTailwind(
      altNode,
      resolvedProperties,
      rules,
      framework as FrameworkType,
      undefined,
      undefined,
      nodeId,
      { withProps: false }
    );
  } else if (framework === 'react-tailwind-v4') {
    result = await generateReactTailwindV4(
      altNode,
      resolvedProperties,
      rules,
      framework as FrameworkType,
      undefined,
      undefined,
      nodeId,
      { withProps: false }
    );
  } else {
    result = await generateHTMLTailwindCSS(
      altNode,
      resolvedProperties,
      rules,
      framework as FrameworkType,
      undefined,
      undefined,
      nodeId
    );
  }

  return {
    code: result.code,
    css: result.css,
  };
}

/**
 * Compare two strings and show diff
 */
function showDiff(expected: string, actual: string, filename: string): void {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');

  console.log(`\n  DIFF in ${filename}:`);
  console.log('  ' + '─'.repeat(60));

  const maxLines = Math.max(expectedLines.length, actualLines.length);
  let diffCount = 0;

  for (let i = 0; i < maxLines && diffCount < 10; i++) {
    const exp = expectedLines[i] ?? '';
    const act = actualLines[i] ?? '';

    if (exp !== act) {
      diffCount++;
      console.log(`  Line ${i + 1}:`);
      console.log(`    - ${exp.substring(0, 80)}${exp.length > 80 ? '...' : ''}`);
      console.log(`    + ${act.substring(0, 80)}${act.length > 80 ? '...' : ''}`);
    }
  }

  if (diffCount >= 10) {
    console.log(`  ... and more differences`);
  }

  console.log('  ' + '─'.repeat(60));
}

/**
 * Main verify function
 */
async function verify() {
  console.log('=== Golden Test Verify ===\n');

  // Check if outputs exist
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    console.error('ERROR: No golden outputs found.');
    console.error('Run `npm run golden:capture` first to generate baseline outputs.\n');
    process.exit(1);
  }

  // Load rules once
  const rules = await loadRules();
  console.log(`Loaded ${rules.length} rules\n`);

  let passCount = 0;
  let failCount = 0;
  const failures: string[] = [];

  for (const node of GOLDEN_NODES) {
    console.log(`Verifying ${node.dirName}...`);

    try {
      // Load node data and variables
      const nodeData = await loadNodeData(node.dirName);
      const variables = await loadVariables(node.dirName);

      for (const framework of FRAMEWORKS) {
        try {
          const output = await generateCode(
            nodeData,
            variables,
            rules,
            framework,
            node.nodeId
          );

          // Load expected code
          const codeExt = framework === 'html-css' ? 'html' : 'tsx';
          const codePath = path.join(OUTPUT_DIR, `${node.dirName}.${framework}.${codeExt}`);

          let expectedCode: string;
          try {
            expectedCode = await fs.readFile(codePath, 'utf-8');
          } catch {
            console.log(`  ⚠ ${framework}: No golden output found (skipped)`);
            continue;
          }

          // Compare code
          if (output.code !== expectedCode) {
            console.log(`  ✗ ${framework}: CODE MISMATCH`);
            showDiff(expectedCode, output.code, `${node.dirName}.${framework}.${codeExt}`);
            failCount++;
            failures.push(`${node.dirName}/${framework}/code`);
            continue;
          }

          // Compare CSS if present
          const cssPath = path.join(OUTPUT_DIR, `${node.dirName}.${framework}.css`);
          try {
            const expectedCss = await fs.readFile(cssPath, 'utf-8');
            if (output.css !== expectedCss) {
              console.log(`  ✗ ${framework}: CSS MISMATCH`);
              showDiff(expectedCss, output.css || '', `${node.dirName}.${framework}.css`);
              failCount++;
              failures.push(`${node.dirName}/${framework}/css`);
              continue;
            }
          } catch {
            // No CSS golden output - that's OK if output also has no CSS
            if (output.css && output.css.trim()) {
              console.log(`  ⚠ ${framework}: Generated CSS but no golden CSS exists`);
            }
          }

          console.log(`  ✓ ${framework}`);
          passCount++;
        } catch (err) {
          console.log(`  ✗ ${framework}: ${err}`);
          failCount++;
          failures.push(`${node.dirName}/${framework}/error`);
        }
      }
    } catch (err) {
      console.log(`  ✗ Failed to load: ${err}`);
      failCount += FRAMEWORKS.length;
    }

    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`Pass: ${passCount}`);
  console.log(`Fail: ${failCount}`);

  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(f => console.log(`  - ${f}`));
    console.log('\n❌ VERIFICATION FAILED - Regression detected!');
    process.exit(1);
  } else {
    console.log('\n✅ All golden tests pass!');
    process.exit(0);
  }
}

// Run
verify().catch(err => {
  console.error('Verify failed:', err);
  process.exit(1);
});
