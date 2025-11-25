import { describe, it, expect } from 'vitest';
import { generateReactJSX } from '@/lib/code-generators/react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import {
  toPascalCase,
  cssPropToTailwind,
  cssObjectToString,
  toKebabCase,
  formatCode,
} from '@/lib/code-generators/helpers';
import type { SimpleAltNode } from '@/lib/altnode-transform';

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Code Generators - Helper Functions', () => {
  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('button-primary')).toBe('ButtonPrimary');
      expect(toPascalCase('icon-24px')).toBe('Icon24px');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('icon_24px')).toBe('Icon24px');
      expect(toPascalCase('button_primary')).toBe('ButtonPrimary');
    });

    it('should prefix numeric-leading names with "Component"', () => {
      expect(toPascalCase('123Button')).toBe('Component123button');
      expect(toPascalCase('456Icon')).toBe('Component456icon');
    });

    it('should NOT prefix alphabetic names', () => {
      expect(toPascalCase('ButtonPrimary')).toBe('Buttonprimary');
      expect(toPascalCase('IconComponent')).toBe('Iconcomponent');
    });

    it('should handle special characters', () => {
      expect(toPascalCase('button@primary!')).toBe('ButtonPrimary');
      expect(toPascalCase('icon#24$px')).toBe('Icon24Px');
    });

    it('should return "Component" for empty strings', () => {
      expect(toPascalCase('')).toBe('Component');
      expect(toPascalCase('   ')).toBe('Component');
    });
  });

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('buttonPrimary')).toBe('button-primary');
      expect(toKebabCase('iconComponent')).toBe('icon-component');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('ButtonPrimary')).toBe('button-primary');
      expect(toKebabCase('IconComponent')).toBe('icon-component');
    });

    it('should handle spaces and underscores', () => {
      expect(toKebabCase('button primary')).toBe('button-primary');
      expect(toKebabCase('icon_component')).toBe('icon-component');
    });
  });

  describe('cssObjectToString', () => {
    it('should convert CSS object to string', () => {
      const css = { display: 'flex', padding: '16px' };
      const result = cssObjectToString(css);
      expect(result).toContain('display: flex');
      expect(result).toContain('padding: 16px');
    });

    it('should convert camelCase properties to kebab-case', () => {
      const css = { backgroundColor: '#FF0000', fontSize: '16px' };
      const result = cssObjectToString(css);
      expect(result).toContain('background-color: #FF0000');
      expect(result).toContain('font-size: 16px');
    });
  });

  describe('formatCode', () => {
    it('should normalize line breaks and trim whitespace', () => {
      const code = '  line1  \n\n  line2  \n  ';
      const formatted = formatCode(code);
      expect(formatted).toBe('line1\nline2');
    });

    it('should remove empty lines', () => {
      const code = 'line1\n\n\nline2\n\nline3';
      const formatted = formatCode(code);
      expect(formatted).toBe('line1\nline2\nline3');
    });
  });
});

// ============================================================================
// FigmaToCode Tailwind Enhancement Tests (T054/T056)
// ============================================================================

describe('Code Generators - FigmaToCode Tailwind Enhancements', () => {
  describe('Arbitrary Values', () => {
    it('should use arbitrary values for non-standard gap', () => {
      expect(cssPropToTailwind('gap', '13px')).toBe('gap-[13px]');
      expect(cssPropToTailwind('gap', '7px')).toBe('gap-[7px]');
      expect(cssPropToTailwind('gap', '19px')).toBe('gap-[19px]');
    });

    it('should use standard gap classes when available', () => {
      expect(cssPropToTailwind('gap', '0px')).toBe('gap-0');
      expect(cssPropToTailwind('gap', '4px')).toBe('gap-1');
      expect(cssPropToTailwind('gap', '8px')).toBe('gap-2');
      expect(cssPropToTailwind('gap', '16px')).toBe('gap-4');
      expect(cssPropToTailwind('gap', '32px')).toBe('gap-8');
    });

    it('should use arbitrary values for non-standard padding', () => {
      expect(cssPropToTailwind('padding', '13px')).toBe('p-[13px]');
      expect(cssPropToTailwind('padding', '7px')).toBe('p-[7px]');
    });

    it('should use standard padding classes when available', () => {
      expect(cssPropToTailwind('padding', '0px')).toBe('p-0');
      expect(cssPropToTailwind('padding', '4px')).toBe('p-1');
      expect(cssPropToTailwind('padding', '16px')).toBe('p-4');
    });

    it('should use arbitrary values for non-standard border radius', () => {
      expect(cssPropToTailwind('borderRadius', '5px')).toBe('rounded-[5px]');
      expect(cssPropToTailwind('borderRadius', '20px')).toBe('rounded-[20px]');
    });
  });

  describe('Rotation Classes', () => {
    it('should generate standard rotation classes', () => {
      expect(cssPropToTailwind('transform', 'rotate(45deg)')).toBe('rotate-45');
      expect(cssPropToTailwind('transform', 'rotate(90deg)')).toBe('rotate-90');
      expect(cssPropToTailwind('transform', 'rotate(180deg)')).toBe('rotate-180');
    });

    it('should generate negative rotation classes', () => {
      expect(cssPropToTailwind('transform', 'rotate(-45deg)')).toBe('-rotate-45');
      expect(cssPropToTailwind('transform', 'rotate(-90deg)')).toBe('-rotate-90');
    });

    it('should use arbitrary values for non-standard rotations', () => {
      expect(cssPropToTailwind('transform', 'rotate(47deg)')).toBe('rotate-[47deg]');
      expect(cssPropToTailwind('transform', 'rotate(123deg)')).toBe('rotate-[123deg]');
      expect(cssPropToTailwind('transform', 'rotate(-37deg)')).toBe('rotate-[-37deg]');
    });
  });

  describe('Opacity Conversion', () => {
    it('should convert opacity to Tailwind scale', () => {
      expect(cssPropToTailwind('opacity', '0')).toBe('opacity-0');
      expect(cssPropToTailwind('opacity', '0.25')).toBe('opacity-25');
      expect(cssPropToTailwind('opacity', '0.5')).toBe('opacity-50');
      expect(cssPropToTailwind('opacity', '0.75')).toBe('opacity-75');
      expect(cssPropToTailwind('opacity', '1')).toBe('opacity-100');
    });

    it('should round to nearest Tailwind opacity value', () => {
      expect(cssPropToTailwind('opacity', '0.1')).toBe('opacity-0');      // 0.1 < 12.5% → 0
      expect(cssPropToTailwind('opacity', '0.2')).toBe('opacity-25');     // 12.5% < 0.2 < 37.5% → 25
      expect(cssPropToTailwind('opacity', '0.3')).toBe('opacity-25');     // 12.5% < 0.3 < 37.5% → 25
      expect(cssPropToTailwind('opacity', '0.4')).toBe('opacity-50');     // 37.5% < 0.4 < 62.5% → 50
      expect(cssPropToTailwind('opacity', '0.6')).toBe('opacity-50');     // 37.5% < 0.6 < 62.5% → 50
      expect(cssPropToTailwind('opacity', '0.73')).toBe('opacity-75');    // 62.5% < 0.73 < 87.5% → 75
      expect(cssPropToTailwind('opacity', '0.8')).toBe('opacity-75');     // 62.5% < 0.8 < 87.5% → 75
      expect(cssPropToTailwind('opacity', '0.9')).toBe('opacity-100');    // 0.9 > 87.5% → 100
    });
  });

  describe('Display & Flex', () => {
    it('should map display values', () => {
      expect(cssPropToTailwind('display', 'flex')).toBe('flex');
      expect(cssPropToTailwind('display', 'block')).toBe('block');
      expect(cssPropToTailwind('display', 'inline')).toBe('inline');
      expect(cssPropToTailwind('display', 'grid')).toBe('grid');
    });

    it('should map flex direction', () => {
      expect(cssPropToTailwind('flexDirection', 'row')).toBe('flex-row');
      expect(cssPropToTailwind('flexDirection', 'column')).toBe('flex-col');
      expect(cssPropToTailwind('flexDirection', 'row-reverse')).toBe('flex-row-reverse');
    });
  });

  describe('Colors', () => {
    it('should use arbitrary values for background colors', () => {
      expect(cssPropToTailwind('backgroundColor', '#FF0000')).toBe('bg-[#FF0000]');
      expect(cssPropToTailwind('backgroundColor', '#3B82F6')).toBe('bg-[#3B82F6]');
    });

    it('should use arbitrary values for text colors', () => {
      expect(cssPropToTailwind('color', '#000000')).toBe('text-[#000000]');
      expect(cssPropToTailwind('color', '#FFFFFF')).toBe('text-[#FFFFFF]');
    });
  });
});

// ============================================================================
// React JSX Generator Tests (T055)
// ============================================================================

describe('Code Generators - React JSX', () => {
  const sampleNode: Partial<AltNode> = {
    id: '1',
    name: 'Button',
    type: 'FRAME',
    children: [
      {
        id: '2',
        name: 'Text',
        type: 'TEXT',
        characters: 'Click me',
      } as any,
    ],
  };

  const sampleProperties = {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#EF4444',
  };

  it('should generate valid React JSX', () => {
    const result = generateReactJSX(sampleNode as SimpleAltNode, sampleProperties);

    expect(result.code).toContain('export function');
    expect(result.code).toContain('return');
    expect(result.code).toContain('React.CSSProperties');
    expect(result.code).toContain('<div');
    expect(result.code).toContain('</div>');
    expect(result.format).toBe('react-jsx');
    expect(result.language).toBe('tsx');
  });

  it('should use PascalCase component names', () => {
    const result = generateReactJSX(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.code).toContain('export function Button');
    expect(result.metadata.componentName).toBe('Button');
  });

  it('should include styles object', () => {
    const result = generateReactJSX(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.code).toContain('const styles: React.CSSProperties');
    expect(result.code).toContain("display: 'flex'");
    expect(result.code).toContain("padding: '16px'");
  });

  it('should handle deeply nested nodes', () => {
    const deepNode: Partial<AltNode> = {
      id: '1',
      name: 'Container',
      type: 'FRAME',
      children: [
        {
          id: '2',
          name: 'Inner',
          type: 'FRAME',
          children: [
            {
              id: '3',
              name: 'Text',
              type: 'TEXT',
              characters: 'Deep content',
            } as any,
          ],
        } as any,
      ],
    };

    const result = generateReactJSX(deepNode as SimpleAltNode, {});
    expect(result.code.match(/<div/g)?.length).toBeGreaterThan(1);
    expect(result.code).toContain('Deep content');
  });

  it('should handle nodes with no children', () => {
    const leafNode: Partial<AltNode> = {
      id: '1',
      name: 'Box',
      type: 'FRAME',
      children: [],
    };

    const result = generateReactJSX(leafNode as SimpleAltNode, { padding: '8px' });
    expect(result.code).toContain('<div');
    expect(result.code).toContain('/>'); // Self-closing tag
  });

  it('should include metadata', () => {
    const result = generateReactJSX(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.metadata.componentName).toBe('Button');
    expect(result.metadata.nodeId).toBe('1');
    expect(result.metadata.generatedAt).toBeTruthy();
  });
});

// ============================================================================
// React Tailwind Generator Tests (T055)
// ============================================================================

describe('Code Generators - React Tailwind', () => {
  const sampleNode: Partial<AltNode> = {
    id: '1',
    name: 'Button',
    type: 'FRAME',
    children: [],
  };

  const sampleProperties = {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#EF4444',
    borderRadius: '8px',
  };

  it('should generate valid React Tailwind JSX', () => {
    const result = generateReactTailwind(sampleNode as SimpleAltNode, sampleProperties);

    expect(result.code).toContain('export function');
    expect(result.code).toContain('className="');
    expect(result.code).toContain('flex');
    expect(result.format).toBe('react-tailwind');
    expect(result.language).toBe('tsx');
  });

  it('should convert CSS properties to Tailwind classes', () => {
    const result = generateReactTailwind(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.code).toContain('flex');
    expect(result.code).toContain('p-4');
    expect(result.code).toContain('bg-[#EF4444]');
    expect(result.code).toContain('rounded-lg');
  });

  it('should handle arbitrary values', () => {
    const nodeWithArbitrary: Partial<AltNode> = {
      id: '1',
      name: 'Box',
      type: 'FRAME',
      children: [],
    };

    const arbitraryProps = {
      gap: '13px',
      padding: '7px',
    };

    const result = generateReactTailwind(nodeWithArbitrary as SimpleAltNode, arbitraryProps);
    expect(result.code).toContain('gap-[13px]');
    expect(result.code).toContain('p-[7px]');
  });

  it('should handle nested children', () => {
    const nestedNode: Partial<AltNode> = {
      id: '1',
      name: 'Container',
      type: 'FRAME',
      children: [
        {
          id: '2',
          name: 'Child',
          type: 'TEXT',
          characters: 'Content',
        } as any,
      ],
    };

    const result = generateReactTailwind(nestedNode as SimpleAltNode, { display: 'flex' });
    expect(result.code).toContain('className="flex"');
    expect(result.code).toContain('Content');
  });
});

// ============================================================================
// HTML/CSS Generator Tests (T055)
// ============================================================================

describe('Code Generators - HTML/CSS', () => {
  const sampleNode: Partial<AltNode> = {
    id: '1',
    name: 'Button',
    type: 'FRAME',
    children: [],
  };

  const sampleProperties = {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#EF4444',
  };

  it('should generate valid HTML and CSS', () => {
    const result = generateHTMLCSS(sampleNode as SimpleAltNode, sampleProperties);

    expect(result.code).toContain('<div');
    expect(result.code).toContain('</div>');
    expect(result.code).toContain('class="');
    expect(result.css).toContain('.button');
    expect(result.css).toContain('display: flex');
    expect(result.format).toBe('html-css');
    expect(result.language).toBe('html');
  });

  it('should use kebab-case class names', () => {
    const result = generateHTMLCSS(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.code).toContain('class="button"');
    expect(result.css).toContain('.button');
  });

  it('should convert camelCase CSS to kebab-case', () => {
    const result = generateHTMLCSS(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.css).toContain('background-color: #ef4444');
  });

  it('should handle nested children', () => {
    const nestedNode: Partial<AltNode> = {
      id: '1',
      name: 'Container',
      type: 'FRAME',
      children: [
        {
          id: '2',
          name: 'Child',
          type: 'TEXT',
          characters: 'Text content',
        } as any,
      ],
    };

    const result = generateHTMLCSS(nestedNode as SimpleAltNode, { display: 'flex' });
    expect(result.code).toContain('<div class="container">');
    expect(result.code).toContain('<span class="child">Text content</span>');
    expect(result.css).toContain('.container');
  });

  it('should separate HTML and CSS', () => {
    const result = generateHTMLCSS(sampleNode as SimpleAltNode, sampleProperties);
    expect(result.code).toContain('<!-- HTML -->');
    expect(result.code).toContain('/* CSS */');
    expect(result.css).toBeTruthy();
  });
});

// ============================================================================
// Code Readability Tests (T057)
// ============================================================================

describe('Code Generators - Readability', () => {
  it('should use proper indentation (2 spaces)', () => {
    const node: Partial<AltNode> = {
      id: '1',
      name: 'Button',
      type: 'FRAME',
      children: [],
    };

    const result = generateReactJSX(node as SimpleAltNode, { padding: '16px' });
    const lines = result.code.split('\n');
    const indentedLines = lines.filter(line => line.startsWith('  '));
    expect(indentedLines.length).toBeGreaterThan(0);
  });

  it('should use PascalCase component names', () => {
    const node: Partial<AltNode> = {
      id: '1',
      name: 'button-primary',
      type: 'FRAME',
      children: [],
    };

    const result = generateReactJSX(node as SimpleAltNode, {});
    expect(result.code).toContain('export function ButtonPrimary');
    expect(result.metadata.componentName).toBe('ButtonPrimary');
  });

  it('should format CSS properties with proper spacing', () => {
    const node: Partial<AltNode> = {
      id: '1',
      name: 'Box',
      type: 'FRAME',
      children: [],
    };

    const properties = {
      display: 'flex',
      padding: '16px',
      backgroundColor: '#EF4444',
    };

    const result = generateHTMLCSS(node as SimpleAltNode, properties);
    expect(result.css).toContain('display: flex;');
    expect(result.css).toContain('padding: 16px;');
    expect(result.css).toContain('background-color: #ef4444;');
  });
});
