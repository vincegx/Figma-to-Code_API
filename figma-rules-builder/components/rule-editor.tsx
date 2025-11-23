'use client';

/**
 * Monaco Editor Component for Rule Editing
 *
 * Features:
 * - JSON schema validation with rule-schema.json
 * - Real-time syntax checking and error highlighting
 * - Keyboard shortcuts (Ctrl+S / Cmd+S for save)
 * - Autocomplete suggestions for common patterns
 * - Dynamic import to reduce bundle size
 *
 * @see WP08 T054-T055
 */

import { useEffect, useRef, useState } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Rule schema - inline to avoid import issues
// Source: kitty-specs/001-figma-to-code/contracts/rule-schema.json
const ruleSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Figma-to-Code Mapping Rule Schema',
  description: 'JSON schema for validating mapping rules in the rule editor',
  type: 'object',
  required: ['version', 'rules'],
  properties: {
    version: {
      type: 'string',
      description: 'Rule library version (semantic versioning)',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      default: '1.0.0',
    },
    rules: {
      type: 'array',
      description: 'Array of mapping rules',
      items: {
        $ref: '#/definitions/MappingRule',
      },
    },
    metadata: {
      type: 'object',
      description: 'Optional metadata about the rule library',
      properties: {
        createdAt: { type: 'string', format: 'date-time' },
        lastModified: { type: 'string', format: 'date-time' },
        description: { type: 'string' },
      },
    },
  },
  definitions: {
    MappingRule: {
      type: 'object',
      required: ['id', 'name', 'selector', 'transformer', 'priority'],
      properties: {
        id: {
          type: 'string',
          description: 'Unique rule identifier (kebab-case recommended)',
          pattern: '^[a-z0-9-]+$',
          minLength: 1,
        },
        name: { type: 'string', description: 'Human-readable rule name', minLength: 1 },
        selector: { $ref: '#/definitions/Selector' },
        transformer: { $ref: '#/definitions/Transformer' },
        priority: {
          type: 'integer',
          description: 'Conflict resolution order (higher priority wins)',
          minimum: 0,
          maximum: 1000,
        },
        enabled: { type: 'boolean', description: 'Whether this rule is active', default: true },
        description: { type: 'string', description: 'Documentation for this rule' },
      },
      additionalProperties: false,
    },
    Selector: {
      type: 'object',
      description: 'Pattern to match AltNodes (all properties use AND logic)',
      properties: {
        nodeType: {
          type: 'string',
          description: 'Match specific node type',
          enum: ['container', 'text', 'image', 'group'],
        },
        layoutMode: {
          type: 'string',
          description: 'Match layout direction (horizontal = flex-row, vertical = flex-column)',
          enum: ['horizontal', 'vertical'],
        },
        hasChildren: { type: 'boolean', description: 'Match nodes with/without children' },
        customProperties: {
          type: 'object',
          description: 'Match specific CSS properties on the AltNode',
          additionalProperties: {
            oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
          },
        },
      },
      minProperties: 1,
      additionalProperties: false,
    },
    Transformer: {
      type: 'object',
      description: 'Output structure definition for matched nodes',
      required: ['htmlTag'],
      properties: {
        htmlTag: {
          type: 'string',
          description: 'HTML tag to generate (e.g., div, button, span)',
          enum: [
            'div',
            'span',
            'p',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'button',
            'a',
            'img',
            'ul',
            'ol',
            'li',
            'section',
            'article',
            'header',
            'footer',
            'nav',
            'main',
            'aside',
            'form',
            'input',
            'label',
            'textarea',
            'select',
            'option',
          ],
        },
        cssClasses: {
          type: 'array',
          description: 'CSS classes to apply (for Tailwind or external CSS)',
          items: { type: 'string', minLength: 1 },
          uniqueItems: true,
        },
        inlineStyles: {
          type: 'object',
          description: 'Inline CSS properties (camelCase keys)',
          additionalProperties: { type: 'string' },
        },
        attributes: {
          type: 'object',
          description: 'HTML attributes to add (e.g., aria-label, data-* attributes)',
          additionalProperties: { type: 'string' },
        },
      },
      additionalProperties: false,
    },
  },
};

export interface RuleEditorProps {
  /** Initial JSON content to display */
  value?: string;

  /** Callback when content changes */
  onChange?: (value: string | undefined) => void;

  /** Callback when save is triggered (Ctrl+S / Cmd+S) */
  onSave?: (value: string) => void;

  /** Height of the editor */
  height?: string;

  /** Whether editor is read-only */
  readOnly?: boolean;

  /** Auto-load rules from mapping-rules.json on mount */
  autoLoad?: boolean;
}

/**
 * Save rule library to mapping-rules.json via API
 * @see WP08 T056
 */
export async function saveRuleLibrary(jsonContent: string): Promise<{
  success: boolean;
  error?: string;
  ruleCount?: number;
}> {
  try {
    const response = await fetch('/api/rules/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      ruleCount: data.ruleCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Load rule library from mapping-rules.json via API
 * @see WP08 T056
 */
export async function loadRuleLibrary(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/rules/load', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // If there's an error but a fallback is provided, use it
      if (data.fallback) {
        return {
          success: true,
          data: data.fallback,
        };
      }

      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Monaco Editor wrapper component for editing mapping rules
 *
 * Validates rules against rule-schema.json and provides real-time feedback
 */
export function RuleEditor({
  value = '',
  onChange,
  onSave,
  height = '600px',
  readOnly = false,
  autoLoad = false,
}: RuleEditorProps) {
  const [editorValue, setEditorValue] = useState(value);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Auto-load rules on mount if requested (T056)
  useEffect(() => {
    if (autoLoad && !value) {
      const loadRules = async () => {
        setIsLoading(true);
        const result = await loadRuleLibrary();

        if (result.success && result.data) {
          const jsonString = JSON.stringify(result.data, null, 2);
          setEditorValue(jsonString);
          if (onChange) {
            onChange(jsonString);
          }
        } else {
          console.error('[RuleEditor] Failed to load rules:', result.error);
        }

        setIsLoading(false);
      };

      loadRules();
    }
  }, [autoLoad]); // Only run once on mount

  /**
   * Configure Monaco Editor before mount
   * - Register JSON schema for validation
   * - Set up language features
   */
  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;

    // Configure JSON language defaults
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: 'http://internal/rule-schema.json', // Internal schema URI
          fileMatch: ['*'], // Apply to all files in this editor
          schema: ruleSchema as any, // Cast to avoid type mismatch
        },
      ],
      enableSchemaRequest: false, // Don't fetch external schemas
    });

    // Add autocomplete for common patterns (T059)
    monaco.languages.registerCompletionItemProvider('json', {
      provideCompletionItems: (
        model: monaco.editor.ITextModel,
        position: monaco.Position
      ) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Suggest common rule templates
        const suggestions: monaco.languages.CompletionItem[] = [];

        // If typing inside "rules" array
        if (textUntilPosition.includes('"rules"') && textUntilPosition.includes('[')) {
          suggestions.push({
            label: 'button-rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '{',
              '  "id": "button-rule",',
              '  "name": "Button Rule",',
              '  "selector": {',
              '    "nodeType": "container",',
              '    "hasChildren": true',
              '  },',
              '  "transformer": {',
              '    "htmlTag": "button",',
              '    "cssClasses": ["btn", "btn-primary"]',
              '  },',
              '  "priority": 10,',
              '  "enabled": true',
              '}',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Template for a button rule',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          });

          suggestions.push({
            label: 'text-rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '{',
              '  "id": "text-rule",',
              '  "name": "Text Rule",',
              '  "selector": {',
              '    "nodeType": "text"',
              '  },',
              '  "transformer": {',
              '    "htmlTag": "p",',
              '    "cssClasses": ["text-base"]',
              '  },',
              '  "priority": 5,',
              '  "enabled": true',
              '}',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Template for a text rule',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          });

          suggestions.push({
            label: 'container-rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              '{',
              '  "id": "container-rule",',
              '  "name": "Container Rule",',
              '  "selector": {',
              '    "nodeType": "container",',
              '    "layoutMode": "horizontal"',
              '  },',
              '  "transformer": {',
              '    "htmlTag": "div",',
              '    "cssClasses": ["flex", "flex-row", "gap-4"]',
              '  },',
              '  "priority": 10,',
              '  "enabled": true',
              '}',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Template for a container rule with horizontal layout',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          });
        }

        return { suggestions };
      },
    });
  };

  /**
   * Handle editor mount
   * - Store editor reference
   * - Register keyboard shortcuts
   */
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+S / Cmd+S for save (T056)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentValue = editor.getValue();
      if (onSave) {
        onSave(currentValue);
      }
    });

    // Focus editor
    editor.focus();
  };

  /**
   * Handle content changes
   */
  const handleChange = (value: string | undefined) => {
    setEditorValue(value || '');
    if (onChange) {
      onChange(value);
    }
  };

  // Update editor value when prop changes
  useEffect(() => {
    if (value !== editorValue && editorRef.current) {
      setEditorValue(value);
    }
  }, [value]);

  return (
    <div className="rule-editor-container w-full" style={{ height }}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading rule library...</p>
          </div>
        </div>
      ) : (
        <Editor
          height="100%"
          defaultLanguage="json"
          value={editorValue}
          onChange={handleChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly,
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900 text-gray-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading Monaco Editor...</p>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
