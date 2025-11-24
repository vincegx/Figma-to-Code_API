'use client';

import {
  Frame,
  Type,
  Square,
  Circle,
  Image,
  Component,
  Link2,
  Group,
  Layers,
  Box,
  Minus,
  Star,
  Pentagon,
  Slice,
  LayoutGrid,
  SeparatorHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FigmaTypeIconProps {
  type: string;
  className?: string;
  size?: number;
}

// Mapping based on Figma REST API node types
// See: https://developers.figma.com/docs/rest-api/file-node-types/
const iconMap: Record<string, React.ElementType> = {
  // Containers
  FRAME: Frame,
  GROUP: Group,
  SECTION: SeparatorHorizontal,

  // Shapes
  RECTANGLE: Square,
  ELLIPSE: Circle,
  VECTOR: Layers,
  BOOLEAN_OPERATION: Box,
  LINE: Minus,
  STAR: Star,
  REGULAR_POLYGON: Pentagon,

  // Content
  TEXT: Type,
  IMAGE: Image,

  // Components (Purple in Figma)
  COMPONENT: Component, // 4 diamonds in Figma
  COMPONENT_SET: LayoutGrid, // Variants container
  INSTANCE: Link2, // Hollow diamond in Figma

  // Export
  SLICE: Slice,
};

export function FigmaTypeIcon({
  type,
  className,
  size = 16,
}: FigmaTypeIconProps) {
  const Icon = iconMap[type] || Frame;
  return <Icon className={cn('shrink-0', className)} size={size} />;
}

export default FigmaTypeIcon;
