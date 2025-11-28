/**
 * API route to serve local images AND SVGs from figma-data
 * GET /api/images/{nodeId}/{filename}
 *
 * - PNG/JPG: figma-data/{nodeId}/img/{filename}
 * - SVG: figma-data/{nodeId}/svg/{filename}
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string; filename: string } }
) {
  const { nodeId, filename } = params;

  // WP32: Extract real nodeId from lib-{nodeId} format
  const realNodeId = nodeId.startsWith('lib-') ? nodeId.replace('lib-', '') : nodeId;

  // Determine subdirectory based on extension
  const ext = path.extname(filename).toLowerCase();
  const subdir = ext === '.svg' ? 'svg' : 'img';

  // Construct path to file
  const filePath = path.join(
    process.cwd(),
    'figma-data',
    realNodeId,
    subdir,
    filename
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return new NextResponse(`File not found: ${subdir}/${filename}`, { status: 404 });
  }

  // Read file
  const fileBuffer = fs.readFileSync(filePath);

  // Determine content type
  let contentType = 'image/png';
  if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

  // Return file
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
