/**
 * Type Integration Tests
 *
 * Verifies that all type definitions compile correctly and work together.
 * These tests ensure type safety and catch circular dependencies.
 */

import { describe, it, expect } from 'vitest';
import type {
  // Figma Types
  FigmaNode,
  FrameNode,
  TextNode,
  Color,
  Rectangle,
  SolidPaint,

  // AltNode Types
  AltNode,
  AltFrameNode,
  AltTextNode,
  AltSceneNode,
  TransformOptions,

  // Rule Types
  MappingRule,
  RuleMatch,
  RuleSet,
  RuleCondition,

  // Code Generation Types
  GeneratedCode,
  GenerationResult,
  BatchGenerationResult,
  FormatOptions,

  // Library Types
  LibraryNode,
  LibraryIndex,
  NodeCollection,
  SearchOptions,

  // Dashboard Types
  DashboardStats,
  DashboardLayout,
  DashboardWidget,

  // Store Types
  NodesStore,
  RulesStore,
  UIStore,
} from '@/lib/types';

import {
  // Type Guards
  isFigmaNode,
  isFrameNode,
  isTextNode,
  isAltNode,
  isAltFrameNode,
  isMappingRule,
  isRuleMatch,
  isGenerationSuccess,
  isLibraryNode,
  isValidColor,
  isValidRectangle,

  // Assertions
  assertFigmaNode,
  assertAltNode,

  // Validation
  validate,

  // Defaults
  DEFAULT_TRANSFORM_OPTIONS,
  DEFAULT_FORMAT_OPTIONS,
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_LIBRARY_CONFIG,
  DEFAULT_DASHBOARD_CONFIG,
} from '@/lib/types';

describe('Type Integration Tests', () => {
  describe('Figma API Types', () => {
    it('should create valid Color type', () => {
      const color: Color = {
        r: 1.0,
        g: 0.5,
        b: 0.0,
        a: 1.0,
      };

      expect(isValidColor(color)).toBe(true);
      expect(color.r).toBe(1.0);
    });

    it('should create valid Rectangle type', () => {
      const rect: Rectangle = {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      };

      expect(isValidRectangle(rect)).toBe(true);
      expect(rect.width).toBe(100);
    });

    it('should create valid SolidPaint type', () => {
      const paint: SolidPaint = {
        type: 'SOLID',
        visible: true,
        opacity: 1.0,
        color: { r: 1, g: 1, b: 1, a: 1 },
      };

      expect(paint.type).toBe('SOLID');
    });

    it('should create valid FrameNode type', () => {
      const frame: FrameNode = {
        id: '1:1',
        name: 'Frame 1',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      };

      expect(isFigmaNode(frame)).toBe(true);
      expect(isFrameNode(frame)).toBe(true);
      assertFigmaNode(frame);
    });

    it('should create valid TextNode type', () => {
      const text: TextNode = {
        id: '1:2',
        name: 'Text 1',
        type: 'TEXT',
        visible: true,
        locked: false,
        characters: 'Hello World',
        style: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 16,
          lineHeightPx: 24,
          letterSpacing: 0,
          textAlignHorizontal: 'LEFT',
          textAlignVertical: 'TOP',
        },
      };

      expect(isFigmaNode(text)).toBe(true);
      expect(isTextNode(text)).toBe(true);
    });
  });

  describe('AltNode Types', () => {
    it('should create valid AltFrameNode type', () => {
      const figmaFrame: FrameNode = {
        id: '1:1',
        name: 'Frame 1',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      };

      const altFrame: AltFrameNode = {
        id: '1:1',
        name: 'Frame 1',
        type: 'FRAME',
        visible: true,
        locked: false,
        opacity: 1.0,
        blendMode: 'NORMAL',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          isRelative: false,
        },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        children: [],
        layout: {
          layoutMode: 'NONE',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0,
        },
        fills: {
          paints: [],
        },
        strokes: {
          paints: [],
          weight: 0,
          align: 'INSIDE',
        },
        cornerRadius: {
          topLeft: 0,
          topRight: 0,
          bottomRight: 0,
          bottomLeft: 0,
          isUniform: true,
        },
        clipsContent: false,
        isComponent: false,
        originalNode: figmaFrame,
      };

      expect(isAltNode(altFrame)).toBe(true);
      expect(isAltFrameNode(altFrame)).toBe(true);
      assertAltNode(altFrame);
    });

    it('should validate TransformOptions type', () => {
      const options: TransformOptions = {
        ...DEFAULT_TRANSFORM_OPTIONS,
        maxDepth: 10,
      };

      expect(options.inferAutoLayout).toBe(true);
      expect(options.maxDepth).toBe(10);
    });

    it('should create valid AltSceneNode type', () => {
      const figmaFrame: FrameNode = {
        id: '1:1',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      };

      const altFrame: AltFrameNode = {
        id: '1:1',
        name: 'Root',
        type: 'FRAME',
        visible: true,
        locked: false,
        opacity: 1.0,
        blendMode: 'NORMAL',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100, isRelative: false },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        children: [],
        layout: {
          layoutMode: 'NONE',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0,
        },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: figmaFrame,
      };

      const scene: AltSceneNode = {
        root: altFrame,
        nodeMap: new Map([['1:1', altFrame]]),
        metadata: {
          fileName: 'Test File',
          lastModified: '2025-01-01',
          version: '1.0',
          totalNodes: 1,
        },
      };

      expect(scene.nodeMap.size).toBe(1);
      expect(scene.metadata.totalNodes).toBe(1);
    });
  });

  describe('Rule Types', () => {
    it('should create valid RuleCondition type', () => {
      const condition: RuleCondition = {
        field: 'name',
        operator: 'contains',
        value: 'Button',
      };

      expect(condition.operator).toBe('contains');
    });

    it('should create valid MappingRule type', () => {
      const rule: MappingRule = {
        metadata: {
          id: 'rule-1',
          name: 'Button Rule',
          description: 'Matches button components',
          version: '1.0.0',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          tags: ['ui', 'button'],
          enabled: true,
        },
        priority: 'high',
        conditions: {
          field: 'name',
          operator: 'contains',
          value: 'Button',
        },
        template: {
          language: 'tsx',
          template: '<button>{{text}}</button>',
          variables: [],
        },
        conflictStrategy: 'highest-priority',
        allowNesting: true,
      };

      expect(isMappingRule(rule)).toBe(true);
      expect(rule.priority).toBe('high');
    });

    it('should create valid RuleSet type', () => {
      const ruleSet: RuleSet = {
        id: 'ruleset-1',
        name: 'UI Components',
        description: 'Rules for UI components',
        version: '1.0.0',
        rules: [],
        defaultConflictStrategy: 'highest-priority',
        metadata: {
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      };

      expect(ruleSet.rules.length).toBe(0);
    });
  });

  describe('Code Generation Types', () => {
    it('should create valid GeneratedCode type', () => {
      const code: GeneratedCode = {
        id: 'code-1',
        nodeId: '1:1',
        nodeName: 'Button',
        format: 'tsx',
        code: '<button>Click me</button>',
        imports: [],
        dependencies: [],
        children: [],
        metadata: {
          generatedAt: '2025-01-01',
          ruleId: 'rule-1',
          ruleName: 'Button Rule',
          confidence: 0.95,
          lineCount: 1,
          characterCount: 28,
        },
      };

      expect(code.format).toBe('tsx');
      expect(code.metadata.confidence).toBe(0.95);
    });

    it('should validate FormatOptions type', () => {
      const options: FormatOptions = {
        ...DEFAULT_FORMAT_OPTIONS,
        indentSize: 4,
      };

      expect(options.indentSize).toBe(4);
      expect(options.format).toBe('tsx');
    });

    it('should create valid GenerationResult type', () => {
      const code: GeneratedCode = {
        id: 'code-1',
        nodeId: '1:1',
        nodeName: 'Button',
        format: 'tsx',
        code: '<button>Click</button>',
        imports: [],
        dependencies: [],
        children: [],
        metadata: {
          generatedAt: '2025-01-01',
          ruleId: 'rule-1',
          ruleName: 'Button Rule',
          confidence: 0.95,
          lineCount: 1,
          characterCount: 22,
        },
      };

      const result: GenerationResult = {
        status: 'success',
        code,
        warnings: [],
      };

      expect(isGenerationSuccess(result)).toBe(true);
    });
  });

  describe('Library Types', () => {
    it('should create valid LibraryNode type', () => {
      const figmaFrame: FrameNode = {
        id: '1:1',
        name: 'Component',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      };

      const altFrame: AltFrameNode = {
        id: '1:1',
        name: 'Component',
        type: 'FRAME',
        visible: true,
        locked: false,
        opacity: 1.0,
        blendMode: 'NORMAL',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100, isRelative: false },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        children: [],
        layout: {
          layoutMode: 'NONE',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0,
        },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: figmaFrame,
      };

      const libraryNode: LibraryNode = {
        id: 'lib-1',
        figmaNodeId: '1:1',
        name: 'Component',
        altNode: altFrame,
        tags: ['ui', 'component'],
        category: 'UI',
        addedAt: '2025-01-01',
        lastModified: '2025-01-01',
        usage: {
          viewCount: 10,
          exportCount: 5,
        },
        metadata: {
          fileKey: 'file-key',
          fileName: 'Design File',
          nodeUrl: 'https://figma.com/file/...',
        },
      };

      expect(isLibraryNode(libraryNode)).toBe(true);
      expect(libraryNode.tags.length).toBe(2);
    });

    it('should create valid NodeCollection type', () => {
      const collection: NodeCollection = {
        id: 'collection-1',
        name: 'Buttons',
        description: 'All button components',
        nodeIds: ['lib-1', 'lib-2'],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      expect(collection.nodeIds.length).toBe(2);
    });

    it('should validate LibraryConfig type', () => {
      const config = DEFAULT_LIBRARY_CONFIG;

      expect(config.storage.backend).toBe('indexedDB');
      expect(config.maxNodesPerImport).toBe(100);
    });
  });

  describe('Dashboard Types', () => {
    it('should create valid DashboardStats type', () => {
      const stats: DashboardStats = {
        overview: {
          totalNodes: 100,
          totalCollections: 10,
          totalRules: 20,
          totalGeneratedFiles: 50,
          totalCodeLines: 1000,
          storageUsed: 5000000,
        },
        library: {
          nodesAddedToday: 5,
          nodesAddedThisWeek: 20,
          nodesAddedThisMonth: 80,
          mostViewedNodes: [],
          mostExportedNodes: [],
          recentlyAdded: [],
          topCategories: [],
          topTags: [],
        },
        codeGeneration: {
          totalGenerations: 50,
          successfulGenerations: 48,
          failedGenerations: 2,
          successRate: 96,
          averageConfidence: 85,
          totalLinesGenerated: 1000,
          totalFilesGenerated: 50,
          formatDistribution: [],
          recentGenerations: [],
          averageGenerationTime: 250,
        },
        rules: {
          totalRules: 20,
          enabledRules: 18,
          disabledRules: 2,
          totalMatches: 150,
          averageMatchesPerRule: 7.5,
          topPerformingRules: [],
          underperformingRules: [],
          ruleSetStats: [],
        },
        activity: {
          recentActivity: [],
          activityByType: new Map(),
          activityByDay: [],
        },
        generatedAt: '2025-01-01',
      };

      expect(stats.overview.totalNodes).toBe(100);
      expect(stats.codeGeneration.successRate).toBe(96);
    });

    it('should validate DashboardConfig type', () => {
      const config = DEFAULT_DASHBOARD_CONFIG;

      expect(config.autoRefresh).toBe(true);
      expect(config.refreshInterval).toBe(30000);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify FigmaNode', () => {
      const node = {
        id: '1:1',
        name: 'Test',
        type: 'FRAME',
        visible: true,
        locked: false,
      };

      expect(isFigmaNode(node)).toBe(true);
      expect(isFigmaNode({})).toBe(false);
      expect(isFigmaNode(null)).toBe(false);
    });

    it('should validate using validate utility', () => {
      const node = {
        id: '1:1',
        name: 'Test',
        type: 'FRAME',
        visible: true,
        locked: false,
      };

      const result = validate(node, isFigmaNode, 'Invalid FigmaNode');
      expect(result.valid).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.errors.length).toBe(0);
    });

    it('should return errors for invalid data', () => {
      const result = validate({}, isFigmaNode, 'Invalid FigmaNode');
      expect(result.valid).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.errors.length).toBe(1);
    });
  });

  describe('Default Configurations', () => {
    it('should have valid DEFAULT_TRANSFORM_OPTIONS', () => {
      expect(DEFAULT_TRANSFORM_OPTIONS.preserveOriginal).toBe(true);
      expect(DEFAULT_TRANSFORM_OPTIONS.inferAutoLayout).toBe(true);
    });

    it('should have valid DEFAULT_FORMAT_OPTIONS', () => {
      expect(DEFAULT_FORMAT_OPTIONS.format).toBe('tsx');
      expect(DEFAULT_FORMAT_OPTIONS.indentSize).toBe(2);
    });

    it('should have valid DEFAULT_GENERATOR_CONFIG', () => {
      expect(DEFAULT_GENERATOR_CONFIG.defaultFormat).toBe('tsx');
      expect(DEFAULT_GENERATOR_CONFIG.maxDepth).toBe(20);
    });

    it('should have valid DEFAULT_LIBRARY_CONFIG', () => {
      expect(DEFAULT_LIBRARY_CONFIG.storage.backend).toBe('indexedDB');
      expect(DEFAULT_LIBRARY_CONFIG.maxNodesPerImport).toBe(100);
    });

    it('should have valid DEFAULT_DASHBOARD_CONFIG', () => {
      expect(DEFAULT_DASHBOARD_CONFIG.autoRefresh).toBe(true);
      expect(DEFAULT_DASHBOARD_CONFIG.theme).toBe('system');
    });
  });
});
