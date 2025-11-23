/**
 * Code Generators Unit Tests
 *
 * Tests all three code generators: React JSX, React+Tailwind, HTML/CSS
 */

import { describe, it, expect } from 'vitest';
import { generateReactJSX } from '@/lib/code-generators/react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHtmlCss } from '@/lib/code-generators/html-css';
import {
  toPascalCase,
  toKebabCase,
  cssObjectToString,
  convertToTailwindClasses,
} from '@/lib/code-generators/helpers';
import type { AltNode } from '@/lib/types/altnode';
import type { RuleMatch } from '@/lib/types/rule';

describe('Code Generators - Helpers', () => {
  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('primary-button')).toBe('PrimaryButton');
      expect(toPascalCase('my-component')).toBe('MyComponent');
    });

    it('should convert space-separated to PascalCase', () => {
      expect(toPascalCase('Button Label')).toBe('ButtonLabel');
      expect(toPascalCase('My Test Component')).toBe('MyTestComponent');
    });

    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('my_component')).toBe('MyComponent');
    });

    it('should handle mixed formats', () => {
      expect(toPascalCase('my-test_Component Name')).toBe('MyTestComponentName');
    });
  });

  describe('toKebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('PrimaryButton')).toBe('primary-button');
      expect(toKebabCase('MyComponent')).toBe('my-component');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('myComponent')).toBe('my-component');
      expect(toKebabCase('backgroundColor')).toBe('background-color');
    });
  });

  describe('cssObjectToString', () => {
    it('should convert CSS object to string', () => {
      const css = cssObjectToString({
        display: 'flex',
        gap: '16px',
        padding: '8px',
      });

      expect(css).toContain('display: flex;');
      expect(css).toContain('gap: 16px;');
      expect(css).toContain('padding: 8px;');
    });

    it('should handle camelCase properties', () => {
      const css = cssObjectToString({
        backgroundColor: '#ff0000',
        fontSize: '14px',
      });

      expect(css).toContain('background-color: #ff0000;');
      expect(css).toContain('font-size: 14px;');
    });

    it('should skip undefined values', () => {
      const css = cssObjectToString({
        display: 'flex',
        gap: undefined,
        padding: '8px',
      });

      expect(css).not.toContain('gap');
      expect(css).toContain('display: flex;');
    });
  });

  describe('convertToTailwindClasses', () => {
    it('should convert display properties', () => {
      const classes = convertToTailwindClasses({ display: 'flex' });
      expect(classes).toContain('flex');
    });

    it('should convert flex direction', () => {
      const classes = convertToTailwindClasses({ flexDirection: 'column' });
      expect(classes).toContain('flex-col');
    });

    it('should convert gap to Tailwind scale', () => {
      const classes = convertToTailwindClasses({ gap: '16px' });
      expect(classes).toContain('gap-4'); // 16px / 4 = 4
    });

    it('should convert padding', () => {
      const classes = convertToTailwindClasses({ padding: '8px' });
      expect(classes).toContain('p-2'); // 8px / 4 = 2
    });

    it('should convert font size', () => {
      const classes = convertToTailwindClasses({ fontSize: '14px' });
      expect(classes).toContain('text-sm');
    });

    it('should convert multiple properties', () => {
      const classes = convertToTailwindClasses({
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        padding: '16px',
      });

      expect(classes).toContain('flex');
      expect(classes).toContain('flex-row');
      expect(classes).toContain('gap-2');
      expect(classes).toContain('p-4');
    });
  });
});

describe('React JSX Generator', () => {
  it('should generate basic React component', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        padding: '8px 16px',
      },
    };

    const code = generateReactJSX(altNode, []);

    expect(code).toContain('export function Button()');
    expect(code).toContain('<div');
    expect(code).toContain('style=');
    expect(code).toContain('display');
    expect(code).toContain('padding');
  });

  it('should use htmlTag from rule matches', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Primary Button',
      type: 'container',
      styles: {},
    };

    const ruleMatches: RuleMatch[] = [
      {
        ruleId: 'rule-001',
        priority: 10,
        contributedProperties: {
          htmlTag: 'button',
        },
      },
    ];

    const code = generateReactJSX(altNode, ruleMatches);

    expect(code).toContain('<button');
    expect(code).toContain('</button>');
  });

  it('should generate text content for text nodes', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Label',
      type: 'text',
      styles: {},
      figmaProperties: {
        characters: 'Click me',
      },
    };

    const code = generateReactJSX(altNode, []);

    expect(code).toContain('"Click me"');
  });

  it('should generate nested components', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {},
      children: [
        {
          id: '1:2',
          name: 'Label',
          type: 'text',
          styles: {},
          figmaProperties: {
            characters: 'Click',
          },
        },
      ],
    };

    const code = generateReactJSX(altNode, []);

    expect(code).toContain('<div');
    expect(code).toContain('<span');
    expect(code).toContain('"Click"');
    expect(code).toContain('</span>');
    expect(code).toContain('</div>');
  });

  it('should apply rule-contributed styles', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {},
    };

    const ruleMatches: RuleMatch[] = [
      {
        ruleId: 'rule-001',
        priority: 10,
        contributedProperties: {
          htmlTag: 'button',
          background: '#007bff',
          padding: '8px 16px',
        },
      },
    ];

    const code = generateReactJSX(altNode, ruleMatches);

    expect(code).toContain('background');
    expect(code).toContain('#007bff');
    expect(code).toContain('padding');
  });
});

describe('React + Tailwind Generator', () => {
  it('should generate React component with Tailwind classes', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
      },
    };

    const code = generateReactTailwind(altNode, []);

    expect(code).toContain('export function Button()');
    expect(code).toContain('className=');
    expect(code).toContain('flex');
    expect(code).toContain('gap-2');
  });

  it('should use rule-contributed CSS classes', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {},
    };

    const ruleMatches: RuleMatch[] = [
      {
        ruleId: 'rule-001',
        priority: 10,
        contributedProperties: {
          htmlTag: 'button',
          cssClasses: 'btn btn-primary',
        },
      },
    ];

    const code = generateReactTailwind(altNode, ruleMatches);

    expect(code).toContain('className="btn btn-primary"');
  });

  it('should combine Tailwind and custom classes', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        padding: '8px',
      },
    };

    const ruleMatches: RuleMatch[] = [
      {
        ruleId: 'rule-001',
        priority: 10,
        contributedProperties: {
          cssClasses: 'btn-custom',
        },
      },
    ];

    const code = generateReactTailwind(altNode, ruleMatches);

    expect(code).toContain('className=');
    expect(code).toContain('flex');
    expect(code).toContain('p-2');
    expect(code).toContain('btn-custom');
  });

  it('should generate nested components with Tailwind', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Container',
      type: 'container',
      styles: {
        display: 'flex',
        flexDirection: 'column',
      },
      children: [
        {
          id: '1:2',
          name: 'Title',
          type: 'text',
          styles: {
            fontSize: '24px',
          },
          figmaProperties: {
            characters: 'Hello',
          },
        },
      ],
    };

    const code = generateReactTailwind(altNode, []);

    expect(code).toContain('flex flex-col');
    expect(code).toContain('text-2xl');
    expect(code).toContain('"Hello"');
  });
});

describe('HTML + CSS Generator', () => {
  it('should generate HTML with CSS classes', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        padding: '8px 16px',
      },
    };

    const { html, css } = generateHtmlCss(altNode, []);

    expect(html).toContain('<div');
    expect(html).toContain('class=');
    expect(html).toContain('button-1-1');

    expect(css).toContain('.button-1-1');
    expect(css).toContain('display: flex;');
    expect(css).toContain('padding: 8px 16px;');
  });

  it('should use htmlTag from rules', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {},
    };

    const ruleMatches: RuleMatch[] = [
      {
        ruleId: 'rule-001',
        priority: 10,
        contributedProperties: {
          htmlTag: 'button',
        },
      },
    ];

    const { html } = generateHtmlCss(altNode, ruleMatches);

    expect(html).toContain('<button');
    expect(html).toContain('</button>');
  });

  it('should generate nested HTML structure', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Container',
      type: 'container',
      styles: {
        display: 'flex',
      },
      children: [
        {
          id: '1:2',
          name: 'Title',
          type: 'text',
          styles: {
            fontSize: '24px',
          },
          figmaProperties: {
            characters: 'Hello World',
          },
        },
      ],
    };

    const { html, css } = generateHtmlCss(altNode, []);

    expect(html).toContain('<div');
    expect(html).toContain('<span');
    expect(html).toContain('Hello World');
    expect(html).toContain('</span>');
    expect(html).toContain('</div>');

    expect(css).toContain('.container-1-1');
    expect(css).toContain('display: flex');
    expect(css).toContain('.title-1-2');
    expect(css).toContain('font-size: 24px');
  });

  it('should generate separate CSS for each element', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        background: '#007bff',
      },
      children: [
        {
          id: '1:2',
          name: 'Label',
          type: 'text',
          styles: {
            color: '#ffffff',
          },
          figmaProperties: {
            characters: 'Click',
          },
        },
      ],
    };

    const { css } = generateHtmlCss(altNode, []);

    expect(css).toContain('.button-1-1 {');
    expect(css).toContain('display: flex;');
    expect(css).toContain('background: #007bff;');

    expect(css).toContain('.label-1-2 {');
    expect(css).toContain('color: #ffffff;');
  });
});

describe('Code Readability', () => {
  it('React JSX should have proper indentation', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Container',
      type: 'container',
      styles: {},
      children: [
        {
          id: '1:2',
          name: 'Child',
          type: 'container',
          styles: {},
        },
      ],
    };

    const code = generateReactJSX(altNode, []);
    const lines = code.split('\n');

    // Check that nested elements are indented
    expect(lines.some((line) => line.startsWith('  '))).toBe(true);
    expect(lines.some((line) => line.startsWith('    '))).toBe(true);
  });

  it('HTML should have proper indentation', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Container',
      type: 'container',
      styles: {},
      children: [
        {
          id: '1:2',
          name: 'Child',
          type: 'container',
          styles: {},
        },
      ],
    };

    const { html } = generateHtmlCss(altNode, []);
    const lines = html.split('\n');

    // Check that nested elements are indented
    expect(lines.some((line) => line.startsWith('  '))).toBe(true);
  });

  it('CSS should have proper formatting', () => {
    const altNode: AltNode = {
      id: '1:1',
      name: 'Button',
      type: 'container',
      styles: {
        display: 'flex',
        padding: '8px',
      },
    };

    const { css } = generateHtmlCss(altNode, []);

    expect(css).toContain('{');
    expect(css).toContain('}');
    expect(css).toContain(';');
    expect(css).toContain('  '); // Check for indentation
  });
});
