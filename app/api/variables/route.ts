/**
 * WP31: Variables API
 *
 * GET /api/variables - Get all extracted variables
 * POST /api/variables - Update variable names from user input
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadVariablesMap, updateVariableNames } from '@/lib/utils/variable-extractor';

/**
 * GET /api/variables
 * Returns all extracted variables with their current names
 */
export async function GET() {
  try {
    const variablesMap = await loadVariablesMap();

    return NextResponse.json({
      success: true,
      variables: variablesMap.variables,
      lastUpdated: variablesMap.lastUpdated,
      version: variablesMap.version,
    });
  } catch (error) {
    console.error('Error loading variables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load variables' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/variables
 * Update variable names from user-provided mapping
 *
 * Request body format:
 * {
 *   "names": {
 *     "125:11": "margin/r",
 *     "112:554": "colors/white"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { names?: Record<string, string> };
    const { names } = body;

    if (!names || typeof names !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "names" object in request body' },
        { status: 400 }
      );
    }

    const updatedMap = await updateVariableNames(names);

    return NextResponse.json({
      success: true,
      message: `Updated ${Object.keys(names).length} variable names`,
      variables: updatedMap.variables,
      lastUpdated: updatedMap.lastUpdated,
      version: updatedMap.version,
    });
  } catch (error) {
    console.error('Error updating variables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update variables' },
      { status: 500 }
    );
  }
}
