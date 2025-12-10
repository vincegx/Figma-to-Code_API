import { countNodes } from '../lib/split/detect-components';
import { readFileSync } from 'fs';
import path from 'path';

const nodeId = process.argv[2] || '6055-2654';
const dataPath = path.join(process.cwd(), 'figma-data', nodeId, 'data.json');
const nodeData = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Desired components
const desired = ['header', 'title section', 'Account Overview', 'Quick actions', 'Activity Section', 'Footer'];

console.log('=== Analyse de la structure ===\n');

function analyzeNode(node: any, depth: number, path: string[] = []): void {
  const nc = countNodes(node);
  const indent = '  '.repeat(depth);
  const currentPath = [...path, node.name];
  
  // Check if this matches a desired component
  const isDesired = desired.some(d => d.toLowerCase() === node.name.toLowerCase());
  const marker = isDesired ? ' <<<< DESIRED' : '';
  
  if (depth <= 4 && nc >= 5) {
    console.log(`${indent}${node.name} (${node.type}) - ${nc} nodes | depth=${depth}${marker}`);
  }
  
  if (node.children && depth < 5) {
    for (const child of node.children) {
      analyzeNode(child, depth + 1, currentPath);
    }
  }
}

analyzeNode(nodeData, 0);

console.log('\n=== Composants désirés ===');
function findNode(root: any, name: string): any {
  if (root.name.toLowerCase() === name.toLowerCase()) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNode(child, name);
      if (found) return found;
    }
  }
  return null;
}

function getDepth(root: any, targetId: string, currentDepth = 0): number {
  if (root.id === targetId) return currentDepth;
  if (root.children) {
    for (const child of root.children) {
      const d = getDepth(child, targetId, currentDepth + 1);
      if (d >= 0) return d;
    }
  }
  return -1;
}

desired.forEach(name => {
  const node = findNode(nodeData, name);
  if (node) {
    const depth = getDepth(nodeData, node.id);
    const nc = countNodes(node);
    console.log(`- ${name}: type=${node.type}, depth=${depth}, nodes=${nc}`);
  } else {
    console.log(`- ${name}: NOT FOUND`);
  }
});
