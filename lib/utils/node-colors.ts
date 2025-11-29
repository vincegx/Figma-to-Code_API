// Color system based on Figma's layer panel
// Purple = Components/Instances, Blue = Frames, Gray = Shapes
// See: https://help.figma.com/hc/en-us/articles/30984647753751-FD4B-Components-fundamentals

export interface NodeColorConfig {
  bg: string;
  bgSelected: string;
  text: string;
  border: string;
}

export const nodeTypeColors: Record<string, NodeColorConfig> = {
  // Purple for components (matches Figma)
  COMPONENT: {
    bg: 'bg-purple-500/10',
    bgSelected: 'bg-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  COMPONENT_SET: {
    bg: 'bg-purple-500/10',
    bgSelected: 'bg-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  INSTANCE: {
    bg: 'bg-purple-500/10',
    bgSelected: 'bg-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
  },

  // Blue for frames (matches Figma)
  FRAME: {
    bg: 'bg-blue-500/10',
    bgSelected: 'bg-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  SECTION: {
    bg: 'bg-blue-500/10',
    bgSelected: 'bg-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
  },

  // Orange for groups
  GROUP: {
    bg: 'bg-orange-500/10',
    bgSelected: 'bg-orange-500/25',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },

  // Gray for basic shapes
  TEXT: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  RECTANGLE: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  ELLIPSE: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  LINE: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  STAR: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },
  REGULAR_POLYGON: {
    bg: 'bg-gray-500/10',
    bgSelected: 'bg-gray-500/25',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
  },

  // Pink for vectors
  VECTOR: {
    bg: 'bg-pink-500/10',
    bgSelected: 'bg-pink-500/25',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/30',
  },
  BOOLEAN_OPERATION: {
    bg: 'bg-pink-500/10',
    bgSelected: 'bg-pink-500/25',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/30',
  },

  // Teal for images
  IMAGE: {
    bg: 'bg-teal-500/10',
    bgSelected: 'bg-teal-500/25',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
  },

  // Cyan for slices
  SLICE: {
    bg: 'bg-cyan-500/10',
    bgSelected: 'bg-cyan-500/25',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
  },
};

// Default color for unknown types (fallback to FRAME style)
const defaultColors: NodeColorConfig = {
  bg: 'bg-blue-500/10',
  bgSelected: 'bg-blue-500/25',
  text: 'text-blue-600 dark:text-blue-400',
  border: 'border-blue-500/30',
};

export function getNodeColors(type: string): NodeColorConfig {
  return nodeTypeColors[type] || defaultColors;
}

// Check if a node type is a component type (for special styling)
export function isComponentType(type: string): boolean {
  return ['COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
}
