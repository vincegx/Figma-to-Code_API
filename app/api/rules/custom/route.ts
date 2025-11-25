/**
 * Custom Rules API Route - WP23
 *
 * POST /api/rules/custom - Create new custom rule
 * GET /api/rules/custom - List all custom rules
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { MultiFrameworkRule } from '@/lib/types/rules';
import { validateCustomRule } from '@/lib/validation/rule-schema';

const CUSTOM_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/custom-rules.json');

/**
 * GET /api/rules/custom
 * Load all custom rules
 */
export async function GET() {
  try {
    const content = await fs.readFile(CUSTOM_RULES_PATH, 'utf-8');
    const customRules: MultiFrameworkRule[] = JSON.parse(content);

    return NextResponse.json({
      success: true,
      rules: customRules,
      count: customRules.length,
    });
  } catch (error) {
    console.error('Failed to load custom rules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load custom rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rules/custom
 * Create a new custom rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateCustomRule(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const newRule = validation.data;

    // Load existing rules
    let existingRules: MultiFrameworkRule[] = [];
    try {
      const content = await fs.readFile(CUSTOM_RULES_PATH, 'utf-8');
      existingRules = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      existingRules = [];
    }

    // Check if rule ID already exists
    if (existingRules.some(rule => rule.id === newRule.id)) {
      return NextResponse.json(
        { success: false, error: `Rule with ID '${newRule.id}' already exists` },
        { status: 409 }
      );
    }

    // Add new rule
    existingRules.push(newRule as MultiFrameworkRule);

    // Save to file
    await fs.writeFile(
      CUSTOM_RULES_PATH,
      JSON.stringify(existingRules, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      rule: newRule,
      message: 'Custom rule created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create custom rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to create custom rule: ${errorMessage}` },
      { status: 500 }
    );
  }
}
