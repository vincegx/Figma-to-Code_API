/**
 * API route to serve local images AND SVGs from figma-data
 * GET /api/images/{nodeId}/{filename}
 *
 * - screenshot.png: figma-data/{nodeId}/screenshot.png (thumbnail)
 * - PNG/JPG: figma-data/{nodeId}/img/{filename}
 * - SVG: figma-data/{nodeId}/svg/{filename}
 *
 * Query params (for screenshot.png only):
 * - ?w=224 : resize to width (maintains aspect ratio)
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple PNG resize using canvas-less approach (quality reduction)
// For screenshots only - reduces file size significantly
async function resizeScreenshot(buffer: Buffer, targetWidth: number): Promise<Buffer> {
  // Dynamic import to avoid issues if sharp not installed
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(buffer)
      .resize(targetWidth, null, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toBuffer();
  } catch {
    // sharp not installed, return original
    return buffer;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { nodeId: string; filename: string } }
) {
  const { nodeId, filename } = params;

  // WP32: Extract real nodeId from lib-{nodeId} format
  const realNodeId = nodeId.startsWith('lib-') ? nodeId.replace('lib-', '') : nodeId;

  // Determine subdirectory based on filename and extension
  const ext = path.extname(filename).toLowerCase();

  let filePath: string;

  // Special case: screenshot.png is at root level
  const isScreenshot = filename === 'screenshot.png';
  if (isScreenshot) {
    filePath = path.join(process.cwd(), 'figma-data', realNodeId, 'screenshot.png');
  } else {
    // Other files in subdirectories
    const subdir = ext === '.svg' ? 'svg' : 'img';
    filePath = path.join(process.cwd(), 'figma-data', realNodeId, subdir, filename);
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return new NextResponse(`File not found: ${filename}`, { status: 404 });
  }

  // Read file
  let fileBuffer: Buffer = fs.readFileSync(filePath);

  // Resize screenshot if width param provided
  if (isScreenshot) {
    const widthParam = request.nextUrl.searchParams.get('w');
    if (widthParam) {
      const targetWidth = parseInt(widthParam, 10);
      if (targetWidth > 0 && targetWidth < 2000) {
        fileBuffer = await resizeScreenshot(fileBuffer, targetWidth);
      }
    }
  }

  // Determine content type
  let contentType = 'image/png';
  if (ext === '.svg') contentType = 'image/svg+xml';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

  // Return file
  // WP38 Fix #23: Add CORS header for mask-image in iframe srcDoc
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
