/**
 * SVG Converter Utility
 * Converts Figma VECTOR nodes to SVG data URLs
 * WP32: Hybrid approach - local reconstruction for simple, API for complex
 */

interface SVGData {
  fillGeometry?: Array<{ path: string; windingRule?: string }>;
  strokeGeometry?: Array<{ path: string; windingRule?: string }>;
  fills?: Array<{ type: string; color: { r: number; g: number; b: number; a: number } }>;
  strokes?: Array<{ type: string; color: { r: number; g: number; b: number; a: number } }>;
  strokeWeight?: number;
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * WP32: Check if a VECTOR node is complex and needs API download
 * Complex = multiple fillGeometry paths (boolean operations, compound paths)
 */
export function isComplexVector(svgData: SVGData): boolean {
  const fillCount = svgData.fillGeometry?.length ?? 0;
  const strokeCount = svgData.strokeGeometry?.length ?? 0;

  // Complex if more than 1 fill or stroke geometry
  return fillCount > 1 || strokeCount > 1;
}

/**
 * WP32: Fetch SVG from Figma API for complex vectors
 * Uses GET /v1/images/{file_key}?ids={node_id}&format=svg
 */
export async function fetchSvgFromFigma(
  fileKey: string,
  nodeId: string,
  accessToken: string
): Promise<string | null> {
  if (!fileKey || !accessToken || !nodeId) {
    console.warn('⚠️ Missing fileKey, accessToken, or nodeId for SVG fetch');
    return null;
  }

  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=svg`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Figma-Token': accessToken }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.images?.[nodeId];

    if (!imageUrl) {
      console.warn(`⚠️ No SVG URL returned for node ${nodeId}`);
      return null;
    }

    // Fetch the actual SVG content from S3 URL
    const svgResponse = await fetch(imageUrl);
    if (!svgResponse.ok) {
      throw new Error(`Failed to fetch SVG from ${imageUrl}`);
    }

    return await svgResponse.text();
  } catch (error) {
    console.error(`❌ Failed to fetch SVG for ${nodeId}:`, error);
    return null;
  }
}

/**
 * Convert RGBA (0-1 range) to hex color
 */
function rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a;

  if (a < 1) {
    // Return rgba() for transparency
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Convert to hex for opaque colors
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert Figma VECTOR node data to SVG string
 */
export function convertVectorToSVG(svgData: SVGData): string {
  const { fillGeometry, strokeGeometry, fills, strokes, strokeWeight, bounds } = svgData;

  const width = Math.round(bounds.width);
  const height = Math.round(bounds.height);

  let svgPaths = '';

  // Convert fillGeometry paths
  if (fillGeometry && fills) {
    fillGeometry.forEach((geom, i) => {
      const fill = fills[i] || fills[0];
      if (fill.type === 'SOLID') {
        const fillColor = rgbaToHex(fill.color);
        const fillRule = geom.windingRule === 'EVENODD' ? 'evenodd' : 'nonzero';
        svgPaths += `<path d="${geom.path}" fill="${fillColor}" fill-rule="${fillRule}" />`;
      }
    });
  }

  // Convert strokeGeometry paths
  if (strokeGeometry && strokes) {
    strokeGeometry.forEach((geom, i) => {
      const stroke = strokes[i] || strokes[0];
      if (stroke.type === 'SOLID') {
        const strokeColor = rgbaToHex(stroke.color);
        const weight = strokeWeight || 1;
        svgPaths += `<path d="${geom.path}" stroke="${strokeColor}" stroke-width="${weight}" fill="none" />`;
      }
    });
  }

  // Build complete SVG
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${svgPaths}</svg>`;

  return svg;
}

/**
 * Convert SVG string to base64 data URL
 */
export function svgToDataURL(svg: string): string {
  // Encode SVG as base64
  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Convert Figma VECTOR node to SVG data URL (simple vectors only)
 */
export function vectorToDataURL(svgData: SVGData): string {
  const svg = convertVectorToSVG(svgData);
  return svgToDataURL(svg);
}

/**
 * WP32: Hybrid SVG converter - local for simple, API for complex
 * @param svgData - Vector node data from Figma
 * @param nodeId - Figma node ID (for API fetch)
 * @param fileKey - Figma file key (optional, for API)
 * @param accessToken - Figma access token (optional, for API)
 * @returns SVG data URL (base64 encoded)
 */
export async function getVectorSvgDataURL(
  svgData: SVGData,
  nodeId: string,
  fileKey?: string,
  accessToken?: string
): Promise<string> {
  // Check if complex vector
  if (isComplexVector(svgData) && fileKey && accessToken) {
    console.log(`🔄 Complex SVG detected for ${nodeId}, fetching from API...`);
    const svgContent = await fetchSvgFromFigma(fileKey, nodeId, accessToken);

    if (svgContent) {
      console.log(`✅ Got SVG from API for ${nodeId}`);
      return svgToDataURL(svgContent);
    }

    console.warn(`⚠️ API fetch failed for ${nodeId}, falling back to local reconstruction`);
  }

  // Simple vector or fallback: reconstruct locally
  return vectorToDataURL(svgData);
}
