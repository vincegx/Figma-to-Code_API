'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule } from '@/lib/types/rules';
import { PropertyBlock, PropertyItem } from './property-block';
import { GeneratedCodeSection } from './generated-code-section';
import { RawDataSection } from './raw-data-section';
import { Box, Palette, Layout, Type, Move, Network } from 'lucide-react';

type FrameworkType = 'react-tailwind' | 'html-css' | 'react-inline' | 'swift-ui' | 'android-xml';

interface InformationPanelProps {
  node: SimpleAltNode | null;
  framework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  resolvedProperties?: Record<string, string>;
  allRules?: MultiFrameworkRule[];
}

export function InformationPanel({
  node,
  framework,
  onFrameworkChange,
  resolvedProperties = {},
  allRules = [],
}: InformationPanelProps) {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a node to view its properties
      </div>
    );
  }

  const figmaNode = node.originalNode as any; // Union type - using any for now
  const hasTextContent = node.type === 'TEXT';
  const hasLayout = figmaNode?.layoutMode && figmaNode.layoutMode !== 'NONE';

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Properties Blocks */}
      <div className="border-b border-gray-200 dark:border-gray-700">

        {/* Basic Properties */}
        <PropertyBlock title="Basic" defaultOpen={true} icon={<Box size={16} />}>
          <PropertyItem label="ID" value={node.id} />
          <PropertyItem label="Name" value={node.name} />
          <PropertyItem label="Type" value={node.type} />
          <PropertyItem label="Original Type" value={node.originalNode?.type || node.type} />
          <div className="flex items-center gap-4 text-sm mt-2">
            <PropertyItem label="Visible" value={node.visible !== false} inline={true} />
            <PropertyItem label="Locked" value={figmaNode?.locked || false} inline={true} />
          </div>
        </PropertyBlock>

        {/* Appearance */}
        <PropertyBlock title="Appearance" defaultOpen={true} icon={<Palette size={16} />}>
          {figmaNode?.fills && figmaNode.fills.length > 0 && (
            <PropertyItem label="Fills" value={`${figmaNode.fills.length} fill(s)`} />
          )}
          {figmaNode?.strokes && figmaNode.strokes.length > 0 && (
            <PropertyItem label="Strokes" value={`${figmaNode.strokes.length} stroke(s)`} />
          )}
          {figmaNode?.effects && figmaNode.effects.length > 0 && (
            <PropertyItem label="Effects" value={`${figmaNode.effects.length} effect(s)`} />
          )}
          <PropertyItem label="Opacity" value={figmaNode?.opacity !== undefined ? `${Math.round((figmaNode.opacity || 1) * 100)}%` : '100%'} />
          {figmaNode?.blendMode && figmaNode.blendMode !== 'NORMAL' && (
            <PropertyItem label="Blend Mode" value={figmaNode.blendMode} />
          )}
        </PropertyBlock>

        {/* Layout */}
        <PropertyBlock title="Layout" defaultOpen={hasLayout} icon={<Layout size={16} />}>
          <div className="grid grid-cols-2 gap-2">
            <PropertyItem label="X" value={`${Math.round(figmaNode?.x || figmaNode?.absoluteBoundingBox?.x || 0)}px`} />
            <PropertyItem label="Y" value={`${Math.round(figmaNode?.y || figmaNode?.absoluteBoundingBox?.y || 0)}px`} />
            <PropertyItem label="Width" value={`${Math.round(figmaNode?.width || figmaNode?.absoluteBoundingBox?.width || 0)}px`} />
            <PropertyItem label="Height" value={`${Math.round(figmaNode?.height || figmaNode?.absoluteBoundingBox?.height || 0)}px`} />
          </div>

          {figmaNode?.rotation && figmaNode.rotation !== 0 && (
            <PropertyItem label="Rotation" value={`${Math.round(figmaNode.rotation * 180 / Math.PI)}°`} />
          )}

          {figmaNode?.layoutMode && figmaNode.layoutMode !== 'NONE' && (
            <>
              <PropertyItem label="Layout Mode" value={figmaNode.layoutMode} />
              {figmaNode.paddingLeft !== undefined && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Padding:</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-2">
                    {figmaNode.paddingTop}px {figmaNode.paddingRight}px {figmaNode.paddingBottom}px {figmaNode.paddingLeft}px
                  </span>
                </div>
              )}
              {figmaNode.itemSpacing !== undefined && (
                <PropertyItem label="Gap" value={`${figmaNode.itemSpacing}px`} />
              )}
              {figmaNode.primaryAxisAlignItems && (
                <PropertyItem label="Primary Axis" value={figmaNode.primaryAxisAlignItems} />
              )}
              {figmaNode.counterAxisAlignItems && (
                <PropertyItem label="Counter Axis" value={figmaNode.counterAxisAlignItems} />
              )}
            </>
          )}
        </PropertyBlock>

        {/* Typography - Only for TEXT nodes */}
        {hasTextContent && (
          <PropertyBlock title="Typography" defaultOpen={false} icon={<Type size={16} />}>
            {figmaNode?.style?.fontFamily && (
              <PropertyItem label="Font Family" value={figmaNode.style.fontFamily} />
            )}
            {figmaNode?.style?.fontSize && (
              <PropertyItem label="Font Size" value={`${figmaNode.style.fontSize}px`} />
            )}
            {figmaNode?.style?.fontWeight && (
              <PropertyItem label="Font Weight" value={figmaNode.style.fontWeight} />
            )}
            {figmaNode?.style?.lineHeightPx && (
              <PropertyItem label="Line Height" value={`${figmaNode.style.lineHeightPx}px`} />
            )}
            {figmaNode?.style?.letterSpacing && (
              <PropertyItem label="Letter Spacing" value={`${figmaNode.style.letterSpacing}px`} />
            )}
            {figmaNode?.style?.textAlignHorizontal && (
              <PropertyItem label="Text Align" value={figmaNode.style.textAlignHorizontal} />
            )}
            {figmaNode?.characters && (
              <PropertyItem label="Content" value={figmaNode.characters} inline={false} />
            )}
          </PropertyBlock>
        )}

        {/* Constraints & Behavior */}
        <PropertyBlock title="Constraints & Behavior" defaultOpen={false} icon={<Move size={16} />}>
          {figmaNode?.constraints && (
            <>
              <PropertyItem label="Horizontal" value={figmaNode.constraints.horizontal || 'SCALE'} />
              <PropertyItem label="Vertical" value={figmaNode.constraints.vertical || 'SCALE'} />
            </>
          )}
          <PropertyItem label="Clipping" value={figmaNode?.clipsContent || false} />
        </PropertyBlock>

        {/* Hierarchy */}
        <PropertyBlock title="Hierarchy" defaultOpen={true} icon={<Network size={16} />}>
          {figmaNode?.parent && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Parent:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-2">
                {figmaNode.parent.name} ({figmaNode.parent.type})
              </span>
            </div>
          )}
          {node.children && node.children.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Children:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-2">
                {node.children.length} node(s)
              </span>
              <div className="ml-4 mt-1 space-y-1">
                {node.children.slice(0, 5).map((child: any, idx: number) => (
                  <div key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                    • {child.name} ({child.type})
                  </div>
                ))}
                {node.children.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ... and {node.children.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </PropertyBlock>
      </div>

      {/* Generated Code Section */}
      <GeneratedCodeSection
        node={node}
        framework={framework}
        onFrameworkChange={onFrameworkChange}
        resolvedProperties={resolvedProperties}
        allRules={allRules}
      />

      {/* Raw Data Section */}
      <RawDataSection node={node.originalNode || node} />
    </div>
  );
}
