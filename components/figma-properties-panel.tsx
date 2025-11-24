'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { FigmaNode, Paint, Effect, Color } from '@/lib/types/figma';
import { ChevronDown, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FigmaPropertiesPanelProps {
  node: SimpleAltNode | null;
}

// =============================================================================
// REUSABLE SUB-COMPONENTS (per T151 specs)
// =============================================================================

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  showAddButton?: boolean;
}

function PropertySection({ title, children, defaultOpen = true, showAddButton = false }: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={12} className="text-gray-400" />
          ) : (
            <ChevronRight size={12} className="text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        {showAddButton && (
          <Plus size={14} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

interface PropertyRowProps {
  label: string;
  value: string | number;
  monospace?: boolean;
}

function PropertyRow({ label, value, monospace = true }: PropertyRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <PropertyInput value={String(value)} monospace={monospace} />
    </div>
  );
}

interface PropertyInputProps {
  value: string;
  monospace?: boolean;
  className?: string;
}

function PropertyInput({ value, monospace = true, className }: PropertyInputProps) {
  return (
    <div className={cn(
      "bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs text-gray-900 dark:text-white min-w-[60px] text-right",
      monospace && "font-mono",
      className
    )}>
      {value}
    </div>
  );
}

interface ColorSwatchProps {
  color: Color;
  opacity?: number;
  size?: number;
}

function ColorSwatch({ color, opacity = 1, size = 20 }: ColorSwatchProps) {
  const hex = colorToHex(color);
  return (
    <div
      className="rounded border border-gray-300 dark:border-gray-600 shrink-0"
      style={{
        backgroundColor: hex,
        opacity,
        width: size,
        height: size,
      }}
    />
  );
}

interface FillRowProps {
  fill: Paint;
  index: number;
}

function FillRow({ fill }: FillRowProps) {
  const [visible, setVisible] = useState(fill.visible !== false);

  if (fill.type === 'SOLID' && fill.color) {
    const hex = colorToHex(fill.color);
    const opacity = fill.opacity ?? 1;

    return (
      <div className="flex items-center gap-2 py-1">
        <ColorSwatch color={fill.color} opacity={opacity} />
        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Solid</span>
        <span className="text-xs font-mono text-gray-900 dark:text-white uppercase">{hex}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
          {Math.round(opacity * 100)}%
        </span>
        <button
          onClick={() => setVisible(!visible)}
          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          {visible ? (
            <Eye size={12} className="text-gray-400" />
          ) : (
            <EyeOff size={12} className="text-gray-400" />
          )}
        </button>
      </div>
    );
  }

  const fillType = fill.type as string;
  if (fillType?.startsWith('GRADIENT')) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-gradient-to-r from-purple-500 to-pink-500" />
        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">
          {fillType === 'GRADIENT_LINEAR' ? 'Linear' :
           fillType === 'GRADIENT_RADIAL' ? 'Radial' :
           fillType === 'GRADIENT_ANGULAR' ? 'Angular' : 'Gradient'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round((fill.opacity ?? 1) * 100)}%
        </span>
        <button className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <Eye size={12} className="text-gray-400" />
        </button>
      </div>
    );
  }

  if (fill.type === 'IMAGE') {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-[8px] text-gray-500">IMG</span>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1">Image</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {fill.scaleMode || 'fill'}
        </span>
        <button className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <Eye size={12} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return null;
}

interface EffectRowDisplayProps {
  effect: Effect;
}

function EffectRowDisplay({ effect }: EffectRowDisplayProps) {
  const [visible, setVisible] = useState(effect.visible !== false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
          {formatEffectType(effect.type)}
        </span>
        <button
          onClick={() => setVisible(!visible)}
          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          {visible ? (
            <Eye size={12} className="text-gray-400" />
          ) : (
            <EyeOff size={12} className="text-gray-400" />
          )}
        </button>
      </div>
      {effect.type.includes('SHADOW') && (
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">X</span>
            <PropertyInput value={`${effect.offset?.x ?? 0}`} className="text-center" />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">Y</span>
            <PropertyInput value={`${effect.offset?.y ?? 0}`} className="text-center" />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">Blur</span>
            <PropertyInput value={`${effect.radius ?? 0}`} className="text-center" />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">Spread</span>
            <PropertyInput value={`${effect.spread ?? 0}`} className="text-center" />
          </div>
        </div>
      )}
      {effect.type.includes('BLUR') && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Blur</span>
          <PropertyInput value={`${effect.radius ?? 0}px`} />
        </div>
      )}
      {effect.color && (
        <div className="flex items-center gap-2 mt-1">
          <ColorSwatch color={effect.color} opacity={effect.color.a} size={16} />
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            rgba({Math.round(effect.color.r * 255)}, {Math.round(effect.color.g * 255)}, {Math.round(effect.color.b * 255)}, {effect.color.a?.toFixed(2) ?? 1})
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FigmaPropertiesPanel({ node }: FigmaPropertiesPanelProps) {
  if (!node) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
        Select a node to view properties
      </div>
    );
  }

  const original = node.originalNode as FigmaNode & {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    opacity?: number;
    layoutMode?: string;
    itemSpacing?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    constraints?: { horizontal: string; vertical: string };
    fills?: Paint[];
    strokes?: Paint[];
    strokeWeight?: number;
    strokeAlign?: string;
    effects?: Effect[];
    cornerRadius?: number;
    primaryAxisAlignItems?: string;
    counterAxisAlignItems?: string;
    layoutWrap?: string;
  };

  const hasAutoLayout = original?.layoutMode && original.layoutMode !== 'NONE';
  const hasFills = original?.fills && original.fills.length > 0;
  const hasStrokes = original?.strokes && original.strokes.length > 0;
  const hasEffects = original?.effects && original.effects.length > 0;

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900">
      {/* Position Section - Always visible */}
      <PropertySection title="Position" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <PropertyRow label="X" value={`${original?.x?.toFixed(0) ?? 0}px`} />
          <PropertyRow label="Y" value={`${original?.y?.toFixed(0) ?? 0}px`} />
          <PropertyRow label="W" value={`${original?.width?.toFixed(0) ?? 0}px`} />
          <PropertyRow label="H" value={`${original?.height?.toFixed(0) ?? 0}px`} />
        </div>
        {original?.rotation !== undefined && original.rotation !== 0 && (
          <PropertyRow label="Rotation" value={`${(original.rotation * -180 / Math.PI).toFixed(1)}°`} />
        )}
      </PropertySection>

      {/* Auto Layout Section */}
      {hasAutoLayout && (
        <PropertySection title="Auto Layout" defaultOpen={true}>
          <PropertyRow
            label="Direction"
            value={original.layoutMode === 'HORIZONTAL' ? '→ Horizontal' : '↓ Vertical'}
            monospace={false}
          />
          {original.itemSpacing !== undefined && (
            <PropertyRow label="Gap" value={`${original.itemSpacing}px`} />
          )}
          <div className="grid grid-cols-4 gap-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Top</span>
              <PropertyInput value={`${original.paddingTop ?? 0}`} className="text-center" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Right</span>
              <PropertyInput value={`${original.paddingRight ?? 0}`} className="text-center" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Bottom</span>
              <PropertyInput value={`${original.paddingBottom ?? 0}`} className="text-center" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Left</span>
              <PropertyInput value={`${original.paddingLeft ?? 0}`} className="text-center" />
            </div>
          </div>
          {original.layoutWrap === 'WRAP' && (
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              ↩ Wrap enabled
            </div>
          )}
        </PropertySection>
      )}

      {/* Appearance Section */}
      <PropertySection title="Appearance" defaultOpen={true}>
        <PropertyRow
          label="Opacity"
          value={`${Math.round((original?.opacity ?? 1) * 100)}%`}
        />
        {original?.cornerRadius !== undefined && original.cornerRadius > 0 && (
          <PropertyRow label="Corner Radius" value={`${original.cornerRadius}px`} />
        )}
      </PropertySection>

      {/* Constraints Section */}
      {original?.constraints && (
        <PropertySection title="Constraints" defaultOpen={false}>
          <PropertyRow label="Horizontal" value={original.constraints.horizontal} monospace={false} />
          <PropertyRow label="Vertical" value={original.constraints.vertical} monospace={false} />
        </PropertySection>
      )}

      {/* Fill Section */}
      <PropertySection title="Fill" defaultOpen={hasFills} showAddButton>
        {hasFills ? (
          <div className="space-y-1">
            {original.fills!
              .filter((fill) => fill.visible !== false)
              .map((fill, i) => (
                <FillRow key={i} fill={fill} index={i} />
              ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-1">No fills</div>
        )}
      </PropertySection>

      {/* Stroke Section */}
      <PropertySection title="Stroke" defaultOpen={hasStrokes} showAddButton>
        {hasStrokes ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <PropertyRow label="Weight" value={`${original.strokeWeight ?? 1}px`} />
              <PropertyRow label="Position" value={original.strokeAlign ?? 'CENTER'} monospace={false} />
            </div>
            {original.strokes!
              .filter((stroke) => stroke.visible !== false)
              .map((stroke, i) => (
                <FillRow key={i} fill={stroke} index={i} />
              ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-1">No strokes</div>
        )}
      </PropertySection>

      {/* Effects Section */}
      <PropertySection title="Effects" defaultOpen={hasEffects} showAddButton>
        {hasEffects ? (
          <div className="space-y-3">
            {original.effects!
              .filter((effect) => effect.visible !== false)
              .map((effect, i) => (
                <EffectRowDisplay key={i} effect={effect} />
              ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-1">No effects</div>
        )}
      </PropertySection>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function colorToHex(color: Color): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function formatEffectType(type: string): string {
  const map: Record<string, string> = {
    DROP_SHADOW: 'Drop Shadow',
    INNER_SHADOW: 'Inner Shadow',
    LAYER_BLUR: 'Layer Blur',
    BACKGROUND_BLUR: 'Background Blur',
  };
  return map[type] || type;
}

export default FigmaPropertiesPanel;
