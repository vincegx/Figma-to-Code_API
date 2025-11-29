import { readFileSync } from 'fs';
import { transformToAltNode } from '../lib/altnode-transform';

const dataRaw = readFileSync('figma-data/425-2086/data.json', 'utf-8');
const data = JSON.parse(dataRaw);
const altNode = transformToAltNode(data);

function findAltNode(node: any, id: string): any {
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const result = findAltNode(child, id);
    if (result) return result;
  }
  return null;
}

const textNode = findAltNode(altNode, '425:2107');
if (textNode) {
  console.log('AltNode styles:');
  console.log('  font-family:', textNode.styles?.['font-family']);
  console.log('  font-weight:', textNode.styles?.['font-weight']);
  console.log();
  console.log('Original Figma style:');
  console.log('  fontWeight:', textNode.originalNode?.style?.fontWeight);
  console.log('  fontStyle:', textNode.originalNode?.style?.fontStyle);
}
