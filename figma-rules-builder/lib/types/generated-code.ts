/**
 * Generated Code Type Definitions
 *
 * Output shown in preview tabs (React JSX, React+Tailwind, HTML/CSS)
 * Regenerated on every rule or node change
 */

/**
 * Supported code output formats
 */
export type CodeFormat = 'react-jsx' | 'react-tailwind' | 'html-css';

/**
 * Generated code output
 *
 * Produced by code generators from AltNode + RuleMatches
 * Regenerated within 100ms of changes (constitutional requirement)
 */
export interface GeneratedCode {
  /** Output format */
  format: CodeFormat;

  /** Generated source code */
  code: string;

  /** Separate CSS file (for HTML/CSS format only) */
  styles?: string;

  /** Language for syntax highlighting (jsx, html, css) */
  language: string;

  /** Generation metadata (optional) */
  metadata?: CodeMetadata;
}

/**
 * Metadata about code generation
 *
 * Useful for debugging and performance monitoring
 */
export interface CodeMetadata {
  /** Number of AltNodes processed */
  nodeCount: number;

  /** Number of rules matched */
  ruleCount: number;

  /** ISO 8601 timestamp of generation */
  generatedAt: string;

  /** Generation duration in milliseconds */
  generationTime?: number;
}
