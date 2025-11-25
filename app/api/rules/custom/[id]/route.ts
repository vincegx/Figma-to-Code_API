/**
 * Custom Rules API Route - WP23 (Individual Rule)
 *
 * PUT /api/rules/custom/:id - Update custom rule
 * DELETE /api/rules/custom/:id - Delete custom rule
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { MultiFrameworkRule } from '@/lib/types/rules';
import { validateCustomRule } from '@/lib/validation/rule-schema';

const CUSTOM_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/custom-rules.json');

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/rules/custom/:id
 * Update an existing custom rule
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validation = validateCustomRule(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const updatedRule = validation.data;

    // Ensure ID in body matches URL param
    if (updatedRule.id !== id) {
      return NextResponse.json(
        { success: false, error: 'Rule ID in body must match URL parameter' },
        { status: 400 }
      );
    }

    // Load existing rules
    const content = await fs.readFile(CUSTOM_RULES_PATH, 'utf-8');
    let existingRules: MultiFrameworkRule[] = JSON.parse(content);

    // Find rule index
    const ruleIndex = existingRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Rule with ID '${id}' not found` },
        { status: 404 }
      );
    }

    // Verify it's a custom rule (don't allow updating official/community rules)
    if (existingRules[ruleIndex].type !== 'custom') {
      return NextResponse.json(
        { success: false, error: 'Can only update custom rules via this endpoint' },
        { status: 403 }
      );
    }

    // Update rule
    existingRules[ruleIndex] = updatedRule as MultiFrameworkRule;

    // Save to file
    await fs.writeFile(
      CUSTOM_RULES_PATH,
      JSON.stringify(existingRules, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Custom rule updated successfully',
    });

  } catch (error) {
    console.error('Failed to update custom rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to update custom rule: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rules/custom/:id
 * Delete a custom rule
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Load existing rules
    const content = await fs.readFile(CUSTOM_RULES_PATH, 'utf-8');
    let existingRules: MultiFrameworkRule[] = JSON.parse(content);

    // Find rule
    const ruleIndex = existingRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Rule with ID '${id}' not found` },
        { status: 404 }
      );
    }

    // Verify it's a custom rule (don't allow deleting official/community rules)
    if (existingRules[ruleIndex].type !== 'custom') {
      return NextResponse.json(
        { success: false, error: 'Can only delete custom rules via this endpoint' },
        { status: 403 }
      );
    }

    // Remove rule
    existingRules.splice(ruleIndex, 1);

    // Save to file
    await fs.writeFile(
      CUSTOM_RULES_PATH,
      JSON.stringify(existingRules, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: 'Custom rule deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete custom rule:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to delete custom rule: ${errorMessage}` },
      { status: 500 }
    );
  }
}
