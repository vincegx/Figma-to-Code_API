import { generateReactTailwind } from './lib/code-generators/react-tailwind';
import { transformFigmaToAltNode } from './lib/altnode-transform';
import * as fs from 'fs';

async function main() {
  const dataPath = './figma-data/425-4344/data.json';
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const altNode = transformFigmaToAltNode(rawData);
  
  if (!altNode) {
    console.log('Failed to transform');
    return;
  }
  
  // Generate React-Tailwind
  const reactResult = await generateReactTailwind(altNode, {});
  
  // Search for the image nodes
  const ids = [
    'I425:4346;2538:154260',
    'I425:4348;2540:351642;2540:351353'
  ];
  
  console.log('=== Searching for image elements ===\n');
  
  for (const id of ids) {
    // Find lines containing this ID
    const lines = reactResult.code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(id)) {
        console.log('--- ' + id + ' (line ' + (i+1) + ') ---');
        // Print surrounding context
        for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+2); j++) {
          console.log(lines[j]);
        }
        console.log('');
      }
    }
  }
}

main().catch(console.error);
