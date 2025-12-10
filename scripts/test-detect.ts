import { detectComponents, countNodes } from '../lib/split/detect-components';
import { readFileSync } from 'fs';
import path from 'path';

const nodeId = process.argv[2] || '6055-2654';
const dataPath = path.join(process.cwd(), 'figma-data', nodeId, 'data.json');

const nodeData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('=== Node Info ===');
console.log('Name:', nodeData.name);
console.log('Type:', nodeData.type);
console.log('Total nodes:', countNodes(nodeData));
console.log('Direct children:', nodeData.children?.length || 0);

console.log('\n=== Direct Children ===');
nodeData.children?.forEach((child: any, i: number) => {
  console.log(`${i+1}. ${child.name} (${child.type}) - ${countNodes(child)} nodes`);
});

console.log('\n=== Detected Components ===');
const detected = detectComponents(nodeData);
console.log(`Total detected: ${detected.length}`);
console.log();

detected.forEach((c, i) => {
  console.log(`${i+1}. ${c.name}`);
  console.log(`   Type: ${c.type} | Depth: ${c.depth} | Nodes: ${c.nodeCount} | Score: ${c.score}`);
});
