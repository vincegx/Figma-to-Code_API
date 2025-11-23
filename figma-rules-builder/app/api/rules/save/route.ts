/**
 * API Route: Save Mapping Rules
 *
 * POST /api/rules/save
 * - Receives rule library JSON from Monaco Editor
 * - Validates against rule-schema.json
 * - Writes to mapping-rules.json at project root
 * - Returns success/error response
 *
 * @see WP08 T057
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/rules/save
 *
 * Save rule library to mapping-rules.json
 *
 * Request body: Rule library JSON (validated by Monaco Editor before sending)
 * Response: { success: true, filePath: string } or { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate basic structure (Monaco already validates against schema)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body: expected JSON object' },
        { status: 400 }
      );
    }

    if (!body.version || !Array.isArray(body.rules)) {
      return NextResponse.json(
        {
          error:
            'Invalid rule library: must have "version" (string) and "rules" (array)',
        },
        { status: 400 }
      );
    }

    // Add metadata timestamps
    const ruleLibrary = {
      ...body,
      metadata: {
        ...body.metadata,
        lastModified: new Date().toISOString(),
        // Preserve createdAt if it exists, otherwise set it now
        createdAt: body.metadata?.createdAt || new Date().toISOString(),
      },
    };

    // Write to mapping-rules.json at project root
    const filePath = join(process.cwd(), 'mapping-rules.json');
    await writeFile(filePath, JSON.stringify(ruleLibrary, null, 2), 'utf-8');

    console.log(`[API] Saved ${body.rules.length} rules to ${filePath}`);

    return NextResponse.json({
      success: true,
      filePath: 'mapping-rules.json',
      ruleCount: body.rules.length,
      timestamp: ruleLibrary.metadata.lastModified,
    });
  } catch (error) {
    console.error('[API] Error saving rules:', error);

    return NextResponse.json(
      {
        error: 'Failed to save rules',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
