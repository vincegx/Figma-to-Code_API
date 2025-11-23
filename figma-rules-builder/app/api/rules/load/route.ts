/**
 * API Route: Load Mapping Rules
 *
 * GET /api/rules/load
 * - Reads mapping-rules.json from project root
 * - Returns rule library JSON or empty template if file doesn't exist
 * - Handles errors gracefully
 *
 * @see WP08 T058
 */

import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

/**
 * Default rule library template when no rules file exists
 */
const DEFAULT_RULE_LIBRARY = {
  version: '1.0.0',
  rules: [],
  metadata: {
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    description: 'Empty rule library - add your first rule to get started!',
  },
};

/**
 * GET /api/rules/load
 *
 * Load rule library from mapping-rules.json
 *
 * Response: Rule library JSON or default empty library
 */
export async function GET() {
  try {
    const filePath = join(process.cwd(), 'mapping-rules.json');

    // Check if file exists
    try {
      await access(filePath, constants.F_OK);
    } catch {
      // File doesn't exist, return default template
      console.log('[API] mapping-rules.json not found, returning default template');
      return NextResponse.json(DEFAULT_RULE_LIBRARY);
    }

    // Read and parse file
    const fileContent = await readFile(filePath, 'utf-8');
    const ruleLibrary = JSON.parse(fileContent);

    console.log(
      `[API] Loaded ${ruleLibrary.rules?.length || 0} rules from ${filePath}`
    );

    return NextResponse.json(ruleLibrary);
  } catch (error) {
    console.error('[API] Error loading rules:', error);

    // If there's a parsing error, return the error details
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in mapping-rules.json',
          details: error.message,
          // Suggest default template as fallback
          fallback: DEFAULT_RULE_LIBRARY,
        },
        { status: 422 } // Unprocessable Entity
      );
    }

    // Generic error - return default template as fallback
    return NextResponse.json(
      {
        error: 'Failed to load rules',
        details: error instanceof Error ? error.message : String(error),
        fallback: DEFAULT_RULE_LIBRARY,
      },
      { status: 500 }
    );
  }
}
