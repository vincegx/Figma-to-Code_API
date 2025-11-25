'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { FigmaNode, Paint, Effect, Color } from '@/lib/types/figma';
import { ChevronDown, ChevronRight, Eye, EyeOff, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FigmaPropertiesPanelProps {
  node: SimpleAltNode | null;
}

// =============================================================================
// FIGMA COLOR SCHEME (exact Figma colors)
// =============================================================================
const figmaColors = {
  bg: '#2c2c2c',
  bgLight: '#383838',
  input: '#3d3d3d',
  inputHover: '#4a4a4a',
  border: '#3d3d3d',
  label: '#adadad',
  value: '#ffffff',
  activeBlue: 'rgba(59, 130, 246, 0.2)',
  activeBlueBorder: 'rgba(59, 130, 246, 0.5)',
};

// =============================================================================
// REUSABLE FIGMA-STYLE COMPONENTS
// =============================================================================

interface FigmaSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  showAddButton?: boolean;
  rightContent?: React.ReactNode;
}

function FigmaSection({ title, children, defaultOpen = true, showAddButton = false, rightContent }: FigmaSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: figmaColors.border }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={10} style={{ color: figmaColors.label }} />
          ) : (
            <ChevronRight size={10} style={{ color: figmaColors.label }} />
          )}
          <span className="text-xs font-medium" style={{ color: figmaColors.value }}>{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {rightContent}
          {showAddButton && (
            <Plus size={12} style={{ color: figmaColors.label }} />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Figma-style input display (read-only)
function FigmaInput({ value, prefix, suffix, className }: { value: string | number; prefix?: string; suffix?: string; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs font-mono", className)}
      style={{ backgroundColor: figmaColors.input, color: figmaColors.value }}
    >
      {prefix && <span style={{ color: figmaColors.label }}>{prefix}</span>}
      <span className="flex-1 text-right">{value}</span>
      {suffix && <span style={{ color: figmaColors.label }}>{suffix}</span>}
    </div>
  );
}

// Figma-style label
function FigmaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px]" style={{ color: figmaColors.label }}>
      {children}
    </span>
  );
}

// Alignment button (read-only display)
function AlignButton({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "w-7 h-7 flex items-center justify-center rounded text-xs",
        active && "ring-1"
      )}
      style={{
        backgroundColor: active ? figmaColors.activeBlue : figmaColors.input,
        borderColor: active ? figmaColors.activeBlueBorder : 'transparent',
        color: figmaColors.value,
      }}
    >
      {children}
    </div>
  );
}

// 3x3 Alignment Grid (read-only display)
function AlignmentGrid3x3({ activeX, activeY }: { activeX: 'MIN' | 'CENTER' | 'MAX'; activeY: 'MIN' | 'CENTER' | 'MAX' }) {
  const positions = ['MIN', 'CENTER', 'MAX'] as const;
  const xIndex = positions.indexOf(activeX);
  const yIndex = positions.indexOf(activeY);

  return (
    <div
      className="grid grid-cols-3 gap-1 p-2 rounded"
      style={{ backgroundColor: figmaColors.input }}
    >
      {positions.map((y, yi) =>
        positions.map((x, xi) => {
          const isActive = xi === xIndex && yi === yIndex;
          return (
            <div
              key={`${x}-${y}`}
              className={cn(
                "w-2 h-2 rounded-full",
                isActive ? "bg-blue-500" : "bg-gray-500/30"
              )}
            />
          );
        })
      )}
    </div>
  );
}

// Constraints Visualizer (the cross with anchor points)
function ConstraintsVisualizer({ horizontal, vertical }: { horizontal: string; vertical: string }) {
  // Map constraint types to visual positions
  const hPos = horizontal === 'LEFT' ? 'start' : horizontal === 'RIGHT' ? 'end' : 'center';
  const vPos = vertical === 'TOP' ? 'start' : vertical === 'BOTTOM' ? 'end' : 'center';

  return (
    <div
      className="relative w-20 h-16 rounded"
      style={{ backgroundColor: figmaColors.input }}
    >
      {/* Outer frame */}
      <div className="absolute inset-2 border border-gray-500/30 rounded-sm">
        {/* Horizontal line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/30" />
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500/30" />

        {/* Inner element (representing the node) */}
        <div
          className="absolute w-4 h-3 border border-blue-500 rounded-sm"
          style={{
            left: hPos === 'start' ? '2px' : hPos === 'end' ? 'calc(100% - 18px)' : 'calc(50% - 8px)',
            top: vPos === 'start' ? '2px' : vPos === 'end' ? 'calc(100% - 14px)' : 'calc(50% - 6px)',
          }}
        />

        {/* Constraint indicators */}
        {horizontal === 'LEFT' && (
          <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-blue-500 -translate-y-1/2" />
        )}
        {horizontal === 'RIGHT' && (
          <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-blue-500 -translate-y-1/2" />
        )}
        {vertical === 'TOP' && (
          <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-blue-500 -translate-x-1/2" />
        )}
        {vertical === 'BOTTOM' && (
          <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-blue-500 -translate-x-1/2" />
        )}
      </div>
    </div>
  );
}

// Color Swatch (24x24)
function ColorSwatch({ color, opacity = 1, size = 24 }: { color: Color; opacity?: number; size?: number }) {
  const hex = colorToHex(color);
  return (
    <div
      className="rounded border shrink-0"
      style={{
        backgroundColor: hex,
        opacity,
        width: size,
        height: size,
        borderColor: figmaColors.border,
      }}
    />
  );
}

// Fill/Stroke Row (exact Figma layout)
function FillRow({ fill, visible = true }: { fill: Paint; visible?: boolean }) {
  if (fill.type === 'SOLID' && fill.color) {
    const hex = colorToHex(fill.color);
    const opacity = fill.opacity ?? 1;

    return (
      <div className="flex items-center gap-2">
        <ColorSwatch color={fill.color} opacity={opacity} />
        <span className="text-xs flex-1" style={{ color: figmaColors.value }}>Solid</span>
        <span className="text-xs font-mono uppercase" style={{ color: figmaColors.value }}>{hex}</span>
        <span className="text-xs w-10 text-right" style={{ color: figmaColors.label }}>
          {Math.round(opacity * 100)}%
        </span>
        <div className="p-1">
          {visible ? (
            <Eye size={12} style={{ color: figmaColors.label }} />
          ) : (
            <EyeOff size={12} style={{ color: figmaColors.label }} />
          )}
        </div>
        <div className="p-1">
          <Minus size={12} style={{ color: figmaColors.label }} />
        </div>
      </div>
    );
  }

  const fillType = fill.type as string;
  if (fillType?.startsWith('GRADIENT')) {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border shrink-0"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderColor: figmaColors.border,
          }}
        />
        <span className="text-xs flex-1" style={{ color: figmaColors.value }}>
          {fillType === 'GRADIENT_LINEAR' ? 'Linear' :
           fillType === 'GRADIENT_RADIAL' ? 'Radial' : 'Gradient'}
        </span>
        <span className="text-xs" style={{ color: figmaColors.label }}>Dégradé</span>
        <span className="text-xs w-10 text-right" style={{ color: figmaColors.label }}>
          {Math.round((fill.opacity ?? 1) * 100)}%
        </span>
        <div className="p-1">
          <Eye size={12} style={{ color: figmaColors.label }} />
        </div>
        <div className="p-1">
          <Minus size={12} style={{ color: figmaColors.label }} />
        </div>
      </div>
    );
  }

  if (fill.type === 'IMAGE') {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border shrink-0 flex items-center justify-center text-[8px]"
          style={{ backgroundColor: figmaColors.input, borderColor: figmaColors.border, color: figmaColors.label }}
        >
          IMG
        </div>
        <span className="text-xs flex-1" style={{ color: figmaColors.value }}>Image</span>
        <span className="text-xs" style={{ color: figmaColors.label }}>{fill.scaleMode || 'fill'}</span>
        <span className="text-xs w-10 text-right" style={{ color: figmaColors.label }}>100%</span>
        <div className="p-1">
          <Eye size={12} style={{ color: figmaColors.label }} />
        </div>
        <div className="p-1">
          <Minus size={12} style={{ color: figmaColors.label }} />
        </div>
      </div>
    );
  }

  return null;
}

// Effect Row
function EffectRow({ effect }: { effect: Effect }) {
  const visible = effect.visible !== false;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: figmaColors.value }}>
          {formatEffectType(effect.type)}
        </span>
        <div className="p-1">
          {visible ? (
            <Eye size={12} style={{ color: figmaColors.label }} />
          ) : (
            <EyeOff size={12} style={{ color: figmaColors.label }} />
          )}
        </div>
      </div>

      {effect.type.includes('SHADOW') && (
        <>
          <div className="grid grid-cols-4 gap-1">
            <div>
              <FigmaLabel>X</FigmaLabel>
              <FigmaInput value={effect.offset?.x ?? 0} />
            </div>
            <div>
              <FigmaLabel>Y</FigmaLabel>
              <FigmaInput value={effect.offset?.y ?? 0} />
            </div>
            <div>
              <FigmaLabel>Blur</FigmaLabel>
              <FigmaInput value={effect.radius ?? 0} />
            </div>
            <div>
              <FigmaLabel>Spread</FigmaLabel>
              <FigmaInput value={effect.spread ?? 0} />
            </div>
          </div>
          {effect.color && (
            <div className="flex items-center gap-2">
              <ColorSwatch color={effect.color} opacity={effect.color.a} size={20} />
              <span className="text-xs font-mono" style={{ color: figmaColors.label }}>
                rgba({Math.round(effect.color.r * 255)}, {Math.round(effect.color.g * 255)}, {Math.round(effect.color.b * 255)}, {(effect.color.a ?? 1).toFixed(2)})
              </span>
            </div>
          )}
        </>
      )}

      {effect.type.includes('BLUR') && (
        <div className="flex items-center gap-2">
          <FigmaLabel>Blur</FigmaLabel>
          <FigmaInput value={`${effect.radius ?? 0}px`} className="w-20" />
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
      <div className="p-4 text-sm" style={{ color: figmaColors.label }}>
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
    primaryAxisSizingMode?: string;
    counterAxisSizingMode?: string;
  };

  const hasAutoLayout = original?.layoutMode && original.layoutMode !== 'NONE';
  const hasFills = original?.fills && original.fills.filter(f => f.visible !== false).length > 0;
  const hasStrokes = original?.strokes && original.strokes.filter(s => s.visible !== false).length > 0;
  const hasEffects = original?.effects && original.effects.filter(e => e.visible !== false).length > 0;

  // Get alignment for 3x3 grid
  const primaryAlign = (original?.primaryAxisAlignItems || 'MIN') as 'MIN' | 'CENTER' | 'MAX';
  const counterAlign = (original?.counterAxisAlignItems || 'MIN') as 'MIN' | 'CENTER' | 'MAX';

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: figmaColors.bg }}>
      {/* Position Section */}
      <FigmaSection title="Position" defaultOpen={true}>
        {/* Alignment buttons row */}
        <div>
          <FigmaLabel>Alignement</FigmaLabel>
          <div className="flex items-center gap-2 mt-1">
            {/* Horizontal alignment */}
            <div className="flex gap-0.5">
              <AlignButton active={false}>⊢</AlignButton>
              <AlignButton active={false}>⊕</AlignButton>
              <AlignButton active={false}>⊣</AlignButton>
            </div>
            {/* Vertical alignment */}
            <div className="flex gap-0.5">
              <AlignButton active={false}>⊤</AlignButton>
              <AlignButton active={false}>⊕</AlignButton>
              <AlignButton active={false}>⊥</AlignButton>
            </div>
            {/* Distribute */}
            <AlignButton active={false}>≡</AlignButton>
          </div>
        </div>

        {/* Position X/Y */}
        <div>
          <FigmaLabel>Position</FigmaLabel>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <FigmaInput value={original?.x?.toFixed(1) ?? '0'} prefix="X" />
            <FigmaInput value={original?.y?.toFixed(1) ?? '0'} prefix="Y" />
          </div>
        </div>

        {/* Constraints */}
        {original?.constraints && (
          <div>
            <FigmaLabel>Contraintes</FigmaLabel>
            <div className="flex gap-2 mt-1">
              <div className="space-y-1">
                <FigmaInput
                  value={formatConstraint(String(original.constraints.horizontal), 'horizontal')}
                  className="w-24"
                />
                <FigmaInput
                  value={formatConstraint(String(original.constraints.vertical), 'vertical')}
                  className="w-24"
                />
              </div>
              <ConstraintsVisualizer
                horizontal={String(original.constraints.horizontal)}
                vertical={String(original.constraints.vertical)}
              />
            </div>
          </div>
        )}

        {/* Rotation */}
        <div>
          <FigmaLabel>Rotation</FigmaLabel>
          <div className="flex items-center gap-2 mt-1">
            <FigmaInput
              value={`${((original?.rotation || 0) * -180 / Math.PI).toFixed(0)}°`}
              prefix="↻"
              className="w-20"
            />
            <div className="flex gap-0.5">
              <AlignButton>◇</AlignButton>
              <AlignButton>⊗</AlignButton>
              <AlignButton>≡</AlignButton>
            </div>
          </div>
        </div>
      </FigmaSection>

      {/* Auto Layout Section */}
      {hasAutoLayout && (
        <FigmaSection title="Mise en page automatique" defaultOpen={true}>
          {/* Flux */}
          <div>
            <FigmaLabel>Flux</FigmaLabel>
            <div className="flex gap-0.5 mt-1">
              <AlignButton active={original.layoutWrap === 'WRAP'}>⊞⊞</AlignButton>
              <AlignButton active={original.layoutMode === 'VERTICAL' && original.layoutWrap !== 'WRAP'}>⊞↓</AlignButton>
              <AlignButton active={original.layoutMode === 'HORIZONTAL' && original.layoutWrap !== 'WRAP'}>→→</AlignButton>
              <AlignButton>⊞⊞</AlignButton>
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <FigmaLabel>Dimensions</FigmaLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <FigmaInput
                value={original?.width?.toFixed(0) ?? '0'}
                prefix="W"
                suffix={original.primaryAxisSizingMode === 'FIXED' ? '' : '▼'}
              />
              <FigmaInput
                value={original?.height?.toFixed(0) ?? '0'}
                prefix="H"
                suffix={original.counterAxisSizingMode === 'FIXED' ? '' : '▼'}
              />
            </div>
          </div>

          {/* Alignment Grid + Espace */}
          <div className="flex gap-4">
            <div>
              <FigmaLabel>Alignement</FigmaLabel>
              <div className="mt-1">
                <AlignmentGrid3x3
                  activeX={original.layoutMode === 'HORIZONTAL' ? primaryAlign : counterAlign}
                  activeY={original.layoutMode === 'HORIZONTAL' ? counterAlign : primaryAlign}
                />
              </div>
            </div>
            <div className="flex-1">
              <FigmaLabel>Espace</FigmaLabel>
              <FigmaInput value={original.itemSpacing ?? 0} className="mt-1" suffix="▼" />
            </div>
          </div>

          {/* Margins */}
          <div>
            <FigmaLabel>Marges</FigmaLabel>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <FigmaInput
                value={`${original.paddingLeft ?? 0}`}
                prefix="|·|"
              />
              <FigmaInput
                value={`${original.paddingTop ?? 0}`}
                prefix="≡"
              />
            </div>
          </div>

          {/* Clip content checkbox (display only) */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border"
              style={{ borderColor: figmaColors.label }}
            />
            <span className="text-xs" style={{ color: figmaColors.label }}>
              Masquer le contenu extérieur
            </span>
          </div>
        </FigmaSection>
      )}

      {/* Apparence Section */}
      <FigmaSection title="Apparence" defaultOpen={true}>
        {/* T156: Visibility status */}
        <div className="flex items-center gap-2 mb-2">
          {node.visible ? (
            <>
              <Eye size={14} className="text-green-500" />
              <span className="text-xs text-green-500">Visible</span>
            </>
          ) : (
            <>
              <EyeOff size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Masqué (hidden)</span>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FigmaLabel>Opacité</FigmaLabel>
            <FigmaInput value={`${Math.round((original?.opacity ?? 1) * 100)}%`} className="mt-1" />
          </div>
          {original?.cornerRadius !== undefined && original.cornerRadius > 0 && (
            <div>
              <FigmaLabel>Rayon d&apos;angle</FigmaLabel>
              <FigmaInput value={`${original.cornerRadius}px`} className="mt-1" />
            </div>
          )}
        </div>
      </FigmaSection>

      {/* Fill Section */}
      <FigmaSection title="Remplissage" defaultOpen={hasFills} showAddButton>
        {hasFills ? (
          <div className="space-y-2">
            {original.fills!
              .filter((fill) => fill.visible !== false)
              .map((fill, i) => (
                <FillRow key={i} fill={fill} visible={fill.visible !== false} />
              ))}
          </div>
        ) : (
          <div className="text-xs py-1" style={{ color: figmaColors.label }}>Aucun remplissage</div>
        )}
      </FigmaSection>

      {/* Stroke Section */}
      <FigmaSection title="Tracé" defaultOpen={hasStrokes} showAddButton>
        {hasStrokes ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <FigmaLabel>Weight</FigmaLabel>
                <FigmaInput value={`${original.strokeWeight ?? 1}px`} className="mt-1" />
              </div>
              <div>
                <FigmaLabel>Position</FigmaLabel>
                <FigmaInput value={original.strokeAlign ?? 'CENTER'} className="mt-1" suffix="▼" />
              </div>
            </div>
            {original.strokes!
              .filter((stroke) => stroke.visible !== false)
              .map((stroke, i) => (
                <FillRow key={i} fill={stroke} visible={stroke.visible !== false} />
              ))}
          </div>
        ) : (
          <div className="text-xs py-1" style={{ color: figmaColors.label }}>Aucun tracé</div>
        )}
      </FigmaSection>

      {/* Effects Section */}
      <FigmaSection title="Effets" defaultOpen={hasEffects} showAddButton>
        {hasEffects ? (
          <div className="space-y-3">
            {original.effects!
              .filter((effect) => effect.visible !== false)
              .map((effect, i) => (
                <EffectRow key={i} effect={effect} />
              ))}
          </div>
        ) : (
          <div className="text-xs py-1" style={{ color: figmaColors.label }}>Aucun effet</div>
        )}
      </FigmaSection>
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

function formatConstraint(value: string, axis: 'horizontal' | 'vertical'): string {
  if (axis === 'horizontal') {
    const map: Record<string, string> = {
      LEFT: '⊢ Gauche',
      RIGHT: '⊣ Droite',
      CENTER: '⊕ Centre',
      SCALE: '↔ Échelle',
      MIN: '⊢ Gauche',
      MAX: '⊣ Droite',
      STRETCH: '↔ Étirer',
    };
    return map[value] || value;
  } else {
    const map: Record<string, string> = {
      TOP: '⊤ Haut',
      BOTTOM: '⊥ Bas',
      CENTER: '⊕ Centre',
      SCALE: '↕ Échelle',
      MIN: '⊤ Haut',
      MAX: '⊥ Bas',
      STRETCH: '↕ Étirer',
    };
    return map[value] || value;
  }
}

export default FigmaPropertiesPanel;
