/**
 * Code Generation Types
 *
 * Defines types for generated code output, formatting, and export.
 */

import type { AltNode } from './altnode';
import type { RuleMatch, RuleConflict } from './rules';

// ============================================================================
// Code Format Types
// ============================================================================

export type CodeFormat = 'tsx' | 'html' | 'vue' | 'swift';

export type IndentStyle = 'spaces' | 'tabs';

export interface FormatOptions {
  readonly format: CodeFormat;
  readonly indentStyle: IndentStyle;
  readonly indentSize: number;
  readonly lineWidth: number;
  readonly semicolons: boolean;
  readonly singleQuotes: boolean;
  readonly trailingComma: 'none' | 'es5' | 'all';
  readonly arrowParens: 'always' | 'avoid';
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  format: 'tsx',
  indentStyle: 'spaces',
  indentSize: 2,
  lineWidth: 80,
  semicolons: true,
  singleQuotes: true,
  trailingComma: 'all',
  arrowParens: 'always',
};

// ============================================================================
// Code Generation Context
// ============================================================================

export interface GenerationContext {
  readonly node: AltNode;
  readonly match: RuleMatch;
  readonly parent?: GeneratedCode;
  readonly siblings: readonly GeneratedCode[];
  readonly depth: number;
  readonly formatOptions: FormatOptions;
  readonly customVariables?: Record<string, unknown>;
}

// ============================================================================
// Generated Code Structure
// ============================================================================

export interface CodeImport {
  readonly source: string;
  readonly specifiers: readonly {
    readonly name: string;
    readonly alias?: string;
    readonly isDefault?: boolean;
    readonly isNamespace?: boolean;
  }[];
}

export interface CodeDependency {
  readonly package: string;
  readonly version?: string;
  readonly isDev: boolean;
}

export interface GeneratedCode {
  readonly id: string;
  readonly nodeId: string;
  readonly nodeName: string;
  readonly format: CodeFormat;
  readonly code: string;
  readonly imports: readonly CodeImport[];
  readonly dependencies: readonly CodeDependency[];
  readonly children: readonly GeneratedCode[];
  readonly metadata: {
    readonly generatedAt: string;
    readonly ruleId: string;
    readonly ruleName: string;
    readonly confidence: number;
    readonly lineCount: number;
    readonly characterCount: number;
  };
}

// ============================================================================
// Code Generation Results
// ============================================================================

export interface GenerationSuccess {
  readonly status: 'success';
  readonly code: GeneratedCode;
  readonly warnings: readonly GenerationWarning[];
}

export interface GenerationFailure {
  readonly status: 'failure';
  readonly nodeId: string;
  readonly nodeName: string;
  readonly error: GenerationError;
  readonly partialCode?: string;
}

export type GenerationResult = GenerationSuccess | GenerationFailure;

// ============================================================================
// Error & Warning Types
// ============================================================================

export type GenerationErrorCode =
  | 'NO_MATCHING_RULE'
  | 'TEMPLATE_RENDER_FAILED'
  | 'INVALID_TEMPLATE_VARIABLE'
  | 'CIRCULAR_DEPENDENCY'
  | 'MAX_DEPTH_EXCEEDED'
  | 'UNSUPPORTED_NODE_TYPE'
  | 'INVALID_FORMAT_OPTIONS';

export interface GenerationError {
  readonly code: GenerationErrorCode;
  readonly message: string;
  readonly nodeId: string;
  readonly nodeName: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
}

export type GenerationWarningCode =
  | 'MULTIPLE_MATCHES'
  | 'LOW_CONFIDENCE'
  | 'MISSING_OPTIONAL_PROPERTY'
  | 'DEPRECATED_RULE'
  | 'LARGE_OUTPUT';

export interface GenerationWarning {
  readonly code: GenerationWarningCode;
  readonly message: string;
  readonly nodeId: string;
  readonly severity: 'info' | 'warning';
  readonly suggestion?: string;
}

// ============================================================================
// Batch Generation
// ============================================================================

export interface BatchGenerationOptions {
  readonly nodes: readonly AltNode[];
  readonly formatOptions: FormatOptions;
  readonly parallelism: number;
  readonly continueOnError: boolean;
  readonly collectWarnings: boolean;
}

export interface BatchGenerationResult {
  readonly successful: readonly GenerationSuccess[];
  readonly failed: readonly GenerationFailure[];
  readonly conflicts: readonly RuleConflict[];
  readonly totalNodes: number;
  readonly totalGenerated: number;
  readonly totalFailed: number;
  readonly duration: number; // milliseconds
  readonly generatedAt: string;
}

// ============================================================================
// Code Export Types
// ============================================================================

export type ExportStrategy =
  | 'single-file' // All code in one file
  | 'component-per-file' // Each top-level component in separate file
  | 'node-per-file'; // Each node in separate file

export interface ExportOptions {
  readonly strategy: ExportStrategy;
  readonly outputDir: string;
  readonly fileNaming: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';
  readonly includeImports: boolean;
  readonly includeDependencies: boolean;
  readonly createIndex: boolean;
  readonly formatOptions: FormatOptions;
}

export interface ExportedFile {
  readonly path: string;
  readonly content: string;
  readonly format: CodeFormat;
  readonly size: number; // bytes
  readonly nodeIds: readonly string[];
}

export interface ExportResult {
  readonly files: readonly ExportedFile[];
  readonly dependencies: readonly CodeDependency[];
  readonly indexFile?: ExportedFile;
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly exportedAt: string;
}

// ============================================================================
// Code Preview Types
// ============================================================================

export interface CodePreview {
  readonly code: string;
  readonly format: CodeFormat;
  readonly highlights: readonly {
    readonly line: number;
    readonly column: number;
    readonly length: number;
    readonly message: string;
  }[];
  readonly collapsible: readonly {
    readonly startLine: number;
    readonly endLine: number;
    readonly label: string;
  }[];
}

export interface LivePreviewOptions {
  readonly enableHotReload: boolean;
  readonly showGrid: boolean;
  readonly showBoundingBoxes: boolean;
  readonly scale: number;
}

// ============================================================================
// Generator Configuration
// ============================================================================

export interface GeneratorConfig {
  readonly defaultFormat: CodeFormat;
  readonly defaultFormatOptions: FormatOptions;
  readonly maxDepth: number;
  readonly maxOutputSize: number; // bytes
  readonly enableCaching: boolean;
  readonly cacheDir?: string;
  readonly customTransforms?: Record<string, (value: unknown) => string>;
  readonly customHelpers?: Record<string, (...args: unknown[]) => string>;
}

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  defaultFormat: 'tsx',
  defaultFormatOptions: DEFAULT_FORMAT_OPTIONS,
  maxDepth: 20,
  maxOutputSize: 1024 * 1024, // 1MB
  enableCaching: true,
};
