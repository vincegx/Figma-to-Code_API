/**
 * Rules API Route
 *
 * GET /api/rules
 * Loads mapping rules from filesystem (mapping-rules.json)
 *
 * POST /api/rules
 * Saves mapping rules to filesystem
 *
 * Response (GET):
 * {
 *   "version": "1.0.0",
 *   "rules": MappingRule[],
 *   "metadata": { createdAt, lastModified }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { MappingRule } from '@/lib/types/rules';

const RULES_FILE_PATH = path.join(process.cwd(), 'mapping-rules.json');

interface RulesData {
  version: string;
  rules: MappingRule[];
  metadata?: {
    createdAt: string;
    lastModified: string;
  };
}

/**
 * GET /api/rules
 * Load mapping rules from filesystem
 */
export async function GET() {
  try {
    // Check if rules file exists
    try {
      await fs.access(RULES_FILE_PATH);
    } catch {
      // File doesn't exist, return empty rules
      const emptyRules: RulesData = {
        version: '1.0.0',
        rules: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      };

      // Create the file with empty rules
      await fs.writeFile(RULES_FILE_PATH, JSON.stringify(emptyRules, null, 2));
      return NextResponse.json(emptyRules);
    }

    // Read and parse rules file
    const fileContent = await fs.readFile(RULES_FILE_PATH, 'utf-8');
    const rulesData: RulesData = JSON.parse(fileContent);

    return NextResponse.json(rulesData);
  } catch (error) {
    console.error('Failed to load rules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to load rules: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules
 * Save mapping rules to filesystem
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RulesData;

    // Validate request body
    if (!body.version || !Array.isArray(body.rules)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { version, rules }' },
        { status: 400 }
      );
    }

    // Update metadata
    const rulesData: RulesData = {
      ...body,
      metadata: {
        createdAt: body.metadata?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    };

    // Write to file
    await fs.writeFile(RULES_FILE_PATH, JSON.stringify(rulesData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Rules saved successfully',
    });
  } catch (error) {
    console.error('Failed to save rules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to save rules: ${errorMessage}` },
      { status: 500 }
    );
  }
}
