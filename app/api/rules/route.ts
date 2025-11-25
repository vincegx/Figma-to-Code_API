/**
 * Rules API Route - WP17 Multi-Framework Rules System
 *
 * GET /api/rules
 * Loads multi-framework rules from filesystem (figma-data/rules/)
 *
 * Response (GET):
 * {
 *   "systemRules": MultiFrameworkRule[],
 *   "userRules": MultiFrameworkRule[]
 * }
 *
 * BUG-001 FIX: Serve rules from figma-data/rules/ instead of public/
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { MultiFrameworkRule } from '@/lib/types/rules';

const SYSTEM_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/system-rules.json');
const USER_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/user-rules.json');

/**
 * GET /api/rules
 * Load multi-framework rules from filesystem
 */
export async function GET() {
  try {
    let systemRules: MultiFrameworkRule[] = [];
    let userRules: MultiFrameworkRule[] = [];

    // Load system rules
    try {
      const systemContent = await fs.readFile(SYSTEM_RULES_PATH, 'utf-8');
      systemRules = JSON.parse(systemContent);
    } catch (error) {
      console.warn('System rules not found or invalid, using empty array');
    }

    // Load user rules
    try {
      const userContent = await fs.readFile(USER_RULES_PATH, 'utf-8');
      userRules = JSON.parse(userContent);
    } catch (error) {
      console.warn('User rules not found or invalid, using empty array');
    }

    return NextResponse.json({
      systemRules,
      userRules,
    });
  } catch (error) {
    console.error('Failed to load rules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to load rules: ${errorMessage}` },
      { status: 500 }
    );
  }
}
