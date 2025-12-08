/**
 * Golden Test Corpus
 *
 * List of nodes to use for golden master testing.
 * Each node should cover different edge cases and fixes.
 */

export interface GoldenNode {
  /** Directory name in figma-data/ */
  dirName: string;
  /** Figma node ID (with colon) */
  nodeId: string;
  /** Description of what this node tests */
  description: string;
  /** Fixes/features this node covers */
  covers: string[];
}

export const GOLDEN_NODES: GoldenNode[] = [
  {
    dirName: '6055-2436',
    nodeId: '6055:2436',
    description: 'BGS Homepage - 1440px (361 nodes, 13 depth)',
    covers: ['complex-layout', 'auto-layout', 'icons', 'images', 'gradients', 'variables'],
  },
  {
    dirName: '425-2146',
    nodeId: '425:2146',
    description: 'Hero Header (260 nodes, instances)',
    covers: ['instances', 'auto-layout', 'icons', 'variables'],
  },
  {
    dirName: '493-2811',
    nodeId: '493:2811',
    description: 'Home - long (190 nodes)',
    covers: ['instances', 'images', 'icons', 'variables'],
  },
  {
    dirName: '367-1346',
    nodeId: '367:1346',
    description: 'Home Agency (203 nodes, no variables)',
    covers: ['groups', 'lines', 'images', 'no-variables'],
  },
  {
    dirName: '425-4344',
    nodeId: '425:4344',
    description: 'altC (277 nodes, boolean ops)',
    covers: ['boolean-operations', 'icons', 'vectors', 'no-variables'],
  },
  {
    dirName: '2540-377150',
    nodeId: '2540:377150',
    description: 'Homepage Orbe Portfolio',
    covers: ['general'],
  },
];

/**
 * Frameworks to test for each node
 */
export const FRAMEWORKS = ['react-tailwind', 'react-tailwind-v4', 'html-css'] as const;
export type Framework = typeof FRAMEWORKS[number];
