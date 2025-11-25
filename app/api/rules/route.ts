/**
 * Rules API Route - WP20 Multi-Framework Rules System (3-Tier)
 *
 * GET /api/rules
 * Loads multi-framework rules from filesystem (figma-data/rules/)
 *
 * Response (GET):
 * {
 *   "officialRules": MultiFrameworkRule[],    // From Figma API spec (priority 50)
 *   "communityRules": MultiFrameworkRule[],   // From FigmaToCode (priority 75)
 *   "customRules": MultiFrameworkRule[]       // User-created (priority 100+)
 * }
 *
 * WP20: 3-tier system replacing old system/user classification
 * BUG-001 FIX: Serve rules from figma-data/rules/ instead of public/
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { MultiFrameworkRule } from '@/lib/types/rules';

const OFFICIAL_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/official-figma-rules.json');
const COMMUNITY_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/community-rules.json');
const CUSTOM_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/custom-rules.json');

/**
 * GET /api/rules
 * Load multi-framework rules from filesystem (3-tier system)
 */
export async function GET() {
  try {
    let officialRules: MultiFrameworkRule[] = [];
    let communityRules: MultiFrameworkRule[] = [];
    let customRules: MultiFrameworkRule[] = [];

    // Load official rules (from Figma API spec - WP19)
    try {
      const officialContent = await fs.readFile(OFFICIAL_RULES_PATH, 'utf-8');
      officialRules = JSON.parse(officialContent);
    } catch (error) {
      console.warn('Official rules not found or invalid, using empty array');
    }

    // Load community rules (from FigmaToCode - WP22)
    try {
      const communityContent = await fs.readFile(COMMUNITY_RULES_PATH, 'utf-8');
      communityRules = JSON.parse(communityContent);
    } catch (error) {
      console.warn('Community rules not found or invalid, using empty array');
    }

    // Load custom rules (user-created)
    try {
      const customContent = await fs.readFile(CUSTOM_RULES_PATH, 'utf-8');
      customRules = JSON.parse(customContent);
    } catch (error) {
      console.warn('Custom rules not found or invalid, using empty array');
    }

    return NextResponse.json({
      officialRules,
      communityRules,
      customRules,
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
