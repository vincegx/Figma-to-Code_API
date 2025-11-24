'use client';

import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { FigmaNode, Paint, Effect, Color } from '@/lib/types/figma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface FigmaPropertiesPanelProps {
  node: SimpleAltNode | null;
}

export function FigmaPropertiesPanel({ node }: FigmaPropertiesPanelProps) {
  if (!node) {
    return (
      <div className="p-4 text-muted-foreground">Select a node to view properties</div>
    );
  }

  const original = node.originalNode as FigmaNode & {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
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
  };

  return (
    <div className="space-y-4 p-4">
      {/* 1. Layout Section */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm font-medium">Layout</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1 px-3 pb-3">
          <PropertyRow label="X" value={`${original?.x ?? 0}px`} />
          <PropertyRow label="Y" value={`${original?.y ?? 0}px`} />
          <PropertyRow label="W" value={`${original?.width ?? 0}px`} />
          <PropertyRow label="H" value={`${original?.height ?? 0}px`} />
          {original?.rotation !== undefined && original.rotation !== 0 && (
            <PropertyRow label="Rotation" value={`${original.rotation.toFixed(1)}°`} />
          )}
          {original?.cornerRadius !== undefined && original.cornerRadius > 0 && (
            <PropertyRow label="Radius" value={`${original.cornerRadius}px`} />
          )}
        </CardContent>
      </Card>

      {/* 2. Auto Layout Section (if applicable) */}
      {original?.layoutMode && original.layoutMode !== 'NONE' && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Auto Layout</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 px-3 pb-3">
            <PropertyRow
              label="Direction"
              value={original.layoutMode === 'HORIZONTAL' ? '→ Horizontal' : '↓ Vertical'}
            />
            {original.itemSpacing !== undefined && (
              <PropertyRow label="Gap" value={`${original.itemSpacing}px`} />
            )}
            {(original.paddingLeft || original.paddingTop) && (
              <PropertyRow
                label="Padding"
                value={`${original.paddingTop ?? 0} ${original.paddingRight ?? 0} ${original.paddingBottom ?? 0} ${original.paddingLeft ?? 0}`}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Constraints Section */}
      {original?.constraints && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Constraints</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 px-3 pb-3">
            <PropertyRow label="Horizontal" value={original.constraints.horizontal} />
            <PropertyRow label="Vertical" value={original.constraints.vertical} />
          </CardContent>
        </Card>
      )}

      {/* 4. Fill Section */}
      {original?.fills && original.fills.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Fill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {original.fills
              .filter((fill) => fill.visible !== false)
              .map((fill, i) => (
                <FillSwatch key={i} fill={fill} />
              ))}
          </CardContent>
        </Card>
      )}

      {/* 5. Stroke Section */}
      {original?.strokes && original.strokes.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Stroke</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 px-3 pb-3">
            <PropertyRow label="Weight" value={`${original.strokeWeight ?? 1}px`} />
            <PropertyRow label="Position" value={original.strokeAlign ?? 'CENTER'} />
            {original.strokes
              .filter((stroke) => stroke.visible !== false)
              .map((stroke, i) => (
                <FillSwatch key={i} fill={stroke} />
              ))}
          </CardContent>
        </Card>
      )}

      {/* 6. Effects Section */}
      {original?.effects && original.effects.length > 0 && (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium">Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {original.effects
              .filter((effect) => effect.visible !== false)
              .map((effect, i) => (
                <EffectRow key={i} effect={effect} />
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}

function FillSwatch({ fill }: { fill: Paint }) {
  if (fill.type === 'SOLID' && fill.color) {
    const hex = colorToHex(fill.color);
    const opacity = fill.opacity ?? 1;
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: hex, opacity }}
        />
        <span className="text-xs font-mono uppercase">{hex}</span>
        {opacity < 1 && (
          <span className="text-xs text-muted-foreground">
            {Math.round(opacity * 100)}%
          </span>
        )}
      </div>
    );
  }

  if (fill.type?.startsWith('GRADIENT')) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-200 to-gray-400" />
        <span className="text-xs text-muted-foreground">{fill.type}</span>
      </div>
    );
  }

  if (fill.type === 'IMAGE') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-gray-200 flex items-center justify-center text-xs">
          IMG
        </div>
        <span className="text-xs text-muted-foreground">Image</span>
      </div>
    );
  }

  return null;
}

function EffectRow({ effect }: { effect: Effect }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatEffectType(effect.type)}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {effect.type.includes('SHADOW') && (
          <>
            Offset: {effect.offset?.x ?? 0}, {effect.offset?.y ?? 0} • Blur:{' '}
            {effect.radius ?? 0}px
            {effect.spread !== undefined && ` • Spread: ${effect.spread}px`}
          </>
        )}
        {effect.type.includes('BLUR') && <>Blur: {effect.radius ?? 0}px</>}
      </div>
    </div>
  );
}

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
