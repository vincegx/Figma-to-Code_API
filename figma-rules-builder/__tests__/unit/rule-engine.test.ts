/**
 * Rule Engine Unit Tests
 *
 * Tests rule matching, conflict resolution, and property composition
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateRules,
  selectorMatches,
  resolveConflicts,
  evaluateRulesForTree,
} from '@/lib/rule-engine';
import type { AltNode } from '@/lib/types/altnode';
import type { MappingRule, RuleMatch } from '@/lib/types/rule';

describe('Rule Engine', () => {
  describe('selectorMatches', () => {
    it('should match node type', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Container',
        type: 'container',
        styles: {},
      };

      const matches = selectorMatches(node, { nodeType: 'container' });
      expect(matches).toBe(true);

      const noMatch = selectorMatches(node, { nodeType: 'text' });
      expect(noMatch).toBe(false);
    });

    it('should match horizontal layout mode', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'HStack',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'row',
        },
      };

      const matches = selectorMatches(node, { layoutMode: 'horizontal' });
      expect(matches).toBe(true);

      const noMatch = selectorMatches(node, { layoutMode: 'vertical' });
      expect(noMatch).toBe(false);
    });

    it('should match vertical layout mode', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'VStack',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'column',
        },
      };

      const matches = selectorMatches(node, { layoutMode: 'vertical' });
      expect(matches).toBe(true);
    });

    it('should match hasChildren', () => {
      const nodeWithChildren: AltNode = {
        id: '1:1',
        name: 'Parent',
        type: 'container',
        styles: {},
        children: [
          {
            id: '1:2',
            name: 'Child',
            type: 'text',
            styles: {},
          },
        ],
      };

      const nodeWithoutChildren: AltNode = {
        id: '1:3',
        name: 'Leaf',
        type: 'text',
        styles: {},
      };

      expect(selectorMatches(nodeWithChildren, { hasChildren: true })).toBe(
        true
      );
      expect(selectorMatches(nodeWithChildren, { hasChildren: false })).toBe(
        false
      );
      expect(selectorMatches(nodeWithoutChildren, { hasChildren: false })).toBe(
        true
      );
      expect(selectorMatches(nodeWithoutChildren, { hasChildren: true })).toBe(
        false
      );
    });

    it('should match custom properties', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Button',
        type: 'container',
        styles: {
          padding: '8px 16px',
          borderRadius: '4px',
          background: '#007bff',
        },
      };

      const matches = selectorMatches(node, {
        customProperties: {
          borderRadius: '4px',
        },
      });
      expect(matches).toBe(true);

      const noMatch = selectorMatches(node, {
        customProperties: {
          borderRadius: '8px',
        },
      });
      expect(noMatch).toBe(false);
    });

    it('should use AND logic for multiple selector properties', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Button',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '4px',
        },
      };

      // All properties match
      const allMatch = selectorMatches(node, {
        nodeType: 'container',
        layoutMode: 'horizontal',
        customProperties: {
          borderRadius: '4px',
        },
      });
      expect(allMatch).toBe(true);

      // One property doesn't match
      const oneDoesntMatch = selectorMatches(node, {
        nodeType: 'container',
        layoutMode: 'horizontal',
        customProperties: {
          borderRadius: '8px', // Wrong value
        },
      });
      expect(oneDoesntMatch).toBe(false);
    });

    it('should handle empty selector (matches all)', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Any',
        type: 'container',
        styles: {},
      };

      const matches = selectorMatches(node, {});
      expect(matches).toBe(true);
    });
  });

  describe('evaluateRules', () => {
    it('should match single rule against node', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Button',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'row',
        },
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Horizontal Container → Button',
          selector: {
            nodeType: 'container',
            layoutMode: 'horizontal',
          },
          transformer: {
            htmlTag: 'button',
            cssClasses: ['btn'],
          },
          priority: 10,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(1);
      expect(matches[0].ruleId).toBe('rule-001');
      expect(matches[0].priority).toBe(10);
      expect(matches[0].contributedProperties.htmlTag).toBe('button');
      expect(matches[0].contributedProperties.cssClasses).toBe('btn');
    });

    it('should match multiple rules and sort by priority', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'PrimaryButton',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'row',
          background: '#007bff',
        },
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Any Container → Div',
          selector: {
            nodeType: 'container',
          },
          transformer: {
            htmlTag: 'div',
          },
          priority: 5,
        },
        {
          id: 'rule-002',
          name: 'Horizontal Container → Button',
          selector: {
            nodeType: 'container',
            layoutMode: 'horizontal',
          },
          transformer: {
            htmlTag: 'button',
          },
          priority: 10,
        },
        {
          id: 'rule-003',
          name: 'Blue Button → Primary',
          selector: {
            nodeType: 'container',
            customProperties: {
              background: '#007bff',
            },
          },
          transformer: {
            htmlTag: 'button',
            cssClasses: ['btn-primary'],
          },
          priority: 15,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(3);
      // Check priority sorting (descending)
      expect(matches[0].priority).toBe(15);
      expect(matches[1].priority).toBe(10);
      expect(matches[2].priority).toBe(5);
      expect(matches[0].ruleId).toBe('rule-003');
      expect(matches[1].ruleId).toBe('rule-002');
      expect(matches[2].ruleId).toBe('rule-001');
    });

    it('should skip disabled rules', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Button',
        type: 'container',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Enabled Rule',
          selector: { nodeType: 'container' },
          transformer: { htmlTag: 'div' },
          priority: 10,
          enabled: true,
        },
        {
          id: 'rule-002',
          name: 'Disabled Rule',
          selector: { nodeType: 'container' },
          transformer: { htmlTag: 'button' },
          priority: 20,
          enabled: false,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(1);
      expect(matches[0].ruleId).toBe('rule-001');
    });

    it('should handle no matching rules', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Text',
        type: 'text',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Container Rule',
          selector: { nodeType: 'container' },
          transformer: { htmlTag: 'div' },
          priority: 10,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(0);
    });

    it('should detect conflicts between rules', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Element',
        type: 'container',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Make Div',
          selector: { nodeType: 'container' },
          transformer: { htmlTag: 'div' },
          priority: 10,
        },
        {
          id: 'rule-002',
          name: 'Make Button',
          selector: { nodeType: 'container' },
          transformer: { htmlTag: 'button' },
          priority: 20,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(2);

      // Higher priority rule should list lower priority as conflict
      const highPriorityMatch = matches.find((m) => m.ruleId === 'rule-002');
      expect(highPriorityMatch?.conflictsWith).toContain('rule-001');
      expect(highPriorityMatch?.conflictSeverity).toBe('major'); // htmlTag is major

      // Lower priority rule should also list conflict
      const lowPriorityMatch = matches.find((m) => m.ruleId === 'rule-001');
      expect(lowPriorityMatch?.conflictsWith).toContain('rule-002');
    });

    it('should detect minor conflicts for style properties', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Element',
        type: 'container',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Blue Background',
          selector: { nodeType: 'container' },
          transformer: {
            htmlTag: 'div',
            inlineStyles: { background: '#0000ff' },
          },
          priority: 10,
        },
        {
          id: 'rule-002',
          name: 'Red Background',
          selector: { nodeType: 'container' },
          transformer: {
            htmlTag: 'div',
            inlineStyles: { background: '#ff0000' },
          },
          priority: 20,
        },
      ];

      const matches = evaluateRules(node, rules);

      const match = matches.find((m) => m.ruleId === 'rule-002');
      expect(match?.conflictSeverity).toBe('minor'); // background is minor
    });
  });

  describe('resolveConflicts', () => {
    it('should resolve conflicts by priority', () => {
      const matches: RuleMatch[] = [
        {
          ruleId: 'rule-high',
          priority: 20,
          contributedProperties: {
            htmlTag: 'button',
            cssClasses: 'btn-primary',
          },
        },
        {
          ruleId: 'rule-low',
          priority: 10,
          contributedProperties: {
            htmlTag: 'div',
            cssClasses: 'container',
          },
        },
      ];

      const resolved = resolveConflicts(matches);

      // Higher priority wins
      expect(resolved.resolved.htmlTag).toBe('button');
      expect(resolved.resolved.cssClasses).toBe('btn-primary');

      // Check provenance
      expect(resolved.propertyProvenance.htmlTag).toBe('rule-high');
      expect(resolved.propertyProvenance.cssClasses).toBe('rule-high');
    });

    it('should merge non-conflicting properties', () => {
      const matches: RuleMatch[] = [
        {
          ruleId: 'rule-001',
          priority: 20,
          contributedProperties: {
            htmlTag: 'button',
          },
        },
        {
          ruleId: 'rule-002',
          priority: 15,
          contributedProperties: {
            cssClasses: 'btn-primary',
          },
        },
        {
          ruleId: 'rule-003',
          priority: 10,
          contributedProperties: {
            padding: '8px 16px',
          },
        },
      ];

      const resolved = resolveConflicts(matches);

      // All properties merged
      expect(resolved.resolved.htmlTag).toBe('button');
      expect(resolved.resolved.cssClasses).toBe('btn-primary');
      expect(resolved.resolved.padding).toBe('8px 16px');

      // Check provenance for each property
      expect(resolved.propertyProvenance.htmlTag).toBe('rule-001');
      expect(resolved.propertyProvenance.cssClasses).toBe('rule-002');
      expect(resolved.propertyProvenance.padding).toBe('rule-003');
    });

    it('should handle empty matches', () => {
      const resolved = resolveConflicts([]);

      expect(resolved.resolved).toEqual({});
      expect(resolved.propertyProvenance).toEqual({});
    });

    it('should handle single match (no conflicts)', () => {
      const matches: RuleMatch[] = [
        {
          ruleId: 'rule-001',
          priority: 10,
          contributedProperties: {
            htmlTag: 'div',
            cssClasses: 'container',
            padding: '16px',
          },
        },
      ];

      const resolved = resolveConflicts(matches);

      expect(resolved.resolved).toEqual({
        htmlTag: 'div',
        cssClasses: 'container',
        padding: '16px',
      });

      expect(Object.keys(resolved.propertyProvenance)).toHaveLength(3);
    });
  });

  describe('evaluateRulesForTree', () => {
    it('should evaluate rules for entire tree recursively', () => {
      const tree: AltNode = {
        id: '1:1',
        name: 'Root',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'column',
        },
        children: [
          {
            id: '1:2',
            name: 'Child1',
            type: 'container',
            styles: {
              display: 'flex',
              flexDirection: 'row',
            },
          },
          {
            id: '1:3',
            name: 'Child2',
            type: 'text',
            styles: {},
          },
        ],
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Vertical → VStack',
          selector: { layoutMode: 'vertical' },
          transformer: { htmlTag: 'div', cssClasses: ['vstack'] },
          priority: 10,
        },
        {
          id: 'rule-002',
          name: 'Horizontal → HStack',
          selector: { layoutMode: 'horizontal' },
          transformer: { htmlTag: 'div', cssClasses: ['hstack'] },
          priority: 10,
        },
        {
          id: 'rule-003',
          name: 'Text → Span',
          selector: { nodeType: 'text' },
          transformer: { htmlTag: 'span' },
          priority: 10,
        },
      ];

      const allMatches = evaluateRulesForTree(tree, rules);

      // Check all nodes were processed
      expect(allMatches.size).toBe(3);
      expect(allMatches.has('1:1')).toBe(true);
      expect(allMatches.has('1:2')).toBe(true);
      expect(allMatches.has('1:3')).toBe(true);

      // Check root matches (vertical layout)
      const rootMatches = allMatches.get('1:1');
      expect(rootMatches).toHaveLength(1);
      expect(rootMatches?.[0].ruleId).toBe('rule-001');

      // Check child1 matches (horizontal layout)
      const child1Matches = allMatches.get('1:2');
      expect(child1Matches).toHaveLength(1);
      expect(child1Matches?.[0].ruleId).toBe('rule-002');

      // Check child2 matches (text)
      const child2Matches = allMatches.get('1:3');
      expect(child2Matches).toHaveLength(1);
      expect(child2Matches?.[0].ruleId).toBe('rule-003');
    });

    it('should handle tree with no children', () => {
      const tree: AltNode = {
        id: '1:1',
        name: 'Leaf',
        type: 'text',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Text → Span',
          selector: { nodeType: 'text' },
          transformer: { htmlTag: 'span' },
          priority: 10,
        },
      ];

      const allMatches = evaluateRulesForTree(tree, rules);

      expect(allMatches.size).toBe(1);
      expect(allMatches.get('1:1')).toHaveLength(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle realistic button component mapping', () => {
      const buttonNode: AltNode = {
        id: '1:1',
        name: 'Primary Button',
        type: 'container',
        styles: {
          display: 'flex',
          flexDirection: 'row',
          padding: '8px 16px',
          borderRadius: '4px',
          background: '#007bff',
        },
        children: [
          {
            id: '1:2',
            name: 'Label',
            type: 'text',
            styles: {
              fontSize: '14px',
              color: '#ffffff',
            },
          },
        ],
      };

      const rules: MappingRule[] = [
        {
          id: 'base-button',
          name: 'Base Button Rule',
          selector: {
            nodeType: 'container',
            layoutMode: 'horizontal',
            customProperties: {
              borderRadius: '4px',
            },
          },
          transformer: {
            htmlTag: 'button',
            cssClasses: ['btn'],
          },
          priority: 10,
        },
        {
          id: 'primary-button',
          name: 'Primary Button Variant',
          selector: {
            customProperties: {
              background: '#007bff',
            },
          },
          transformer: {
            htmlTag: 'button',
            cssClasses: ['btn', 'btn-primary'],
            attributes: {
              'aria-label': 'Primary action',
            },
          },
          priority: 20,
        },
      ];

      const matches = evaluateRules(buttonNode, rules);

      expect(matches).toHaveLength(2);
      expect(matches[0].ruleId).toBe('primary-button');
      expect(matches[1].ruleId).toBe('base-button');

      // Check conflict detection
      expect(matches[0].conflictsWith).toContain('base-button');
      expect(matches[0].conflictSeverity).toBe('minor'); // cssClasses conflict

      // Resolve conflicts
      const resolved = resolveConflicts(matches);

      // Higher priority wins on cssClasses
      expect(resolved.resolved.cssClasses).toBe('btn btn-primary');
      expect(resolved.resolved.htmlTag).toBe('button'); // From base-button
    });

    it('should handle zero matches scenario', () => {
      const node: AltNode = {
        id: '1:1',
        name: 'Unmapped',
        type: 'image',
        styles: {},
      };

      const rules: MappingRule[] = [
        {
          id: 'rule-001',
          name: 'Text Only',
          selector: { nodeType: 'text' },
          transformer: { htmlTag: 'span' },
          priority: 10,
        },
      ];

      const matches = evaluateRules(node, rules);

      expect(matches).toHaveLength(0);

      const resolved = resolveConflicts(matches);
      expect(resolved.resolved).toEqual({});
    });
  });
});
