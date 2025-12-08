/**
 * Golden Test Capture Script
 *
 * Generates golden outputs for all nodes in the corpus.
 * Run this BEFORE refactoring to capture expected outputs.
 *
 * Usage: npx ts-node __tests__/golden/capture.ts
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
 * Main capture function
 */
async function capture() {
  console.log('=== Golden Test Capture ===\n');

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Load rules once
  const rules = await loadRules();
  console.log(`Loaded ${rules.length} rules\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const node of GOLDEN_NODES) {
    console.log(`Processing ${node.dirName} (${node.description})...`);

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

          // Save code output
          const codeExt = framework === 'html-css' ? 'html' : 'tsx';
          const codePath = path.join(OUTPUT_DIR, `${node.dirName}.${framework}.${codeExt}`);
          await fs.writeFile(codePath, output.code, 'utf-8');

          // Save CSS output if present
          if (output.css) {
            const cssPath = path.join(OUTPUT_DIR, `${node.dirName}.${framework}.css`);
            await fs.writeFile(cssPath, output.css, 'utf-8');
          }

          console.log(`  ✓ ${framework}`);
          successCount++;
        } catch (err) {
          console.log(`  ✗ ${framework}: ${err}`);
          errorCount++;
        }
      }
    } catch (err) {
      console.log(`  ✗ Failed to load: ${err}`);
      errorCount += FRAMEWORKS.length;
    }

    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nOutputs saved to: ${OUTPUT_DIR}`);
}

// Run
capture().catch(console.error);
