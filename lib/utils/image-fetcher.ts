/**
 * Image Fetcher Utility
 * Fetches real image URLs from Figma Images API
 */

/**
 * Generate unique SVG filename from container info
 * Uses nodeId to ensure uniqueness when multiple nodes have same name
 */
export function generateSvgFilename(name: string, nodeId: string): string {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  // Sanitize nodeId: replace colons and semicolons with dashes
  const sanitizedId = nodeId.replace(/[:;]/g, '-');
  return `${baseName}-${sanitizedId}.svg`;
}

interface ImageNode {
  nodeId: string;
  imageRef: string;
}

interface FigmaImagesResponse {
  err?: string;
  images?: Record<string, string>;
  meta?: {
    images?: Record<string, string>;
  };
}

/**
 * Fetch image URLs from Figma API
 * WP32: Use GET /v1/files/:key/images to get image fills via imageRef
 *
 * @param fileKey - Figma file key (from file URL)
 * @param imageRefs - Array of imageRef strings to fetch URLs for
 * @param accessToken - Figma API access token
 * @returns Map of imageRef → image URL
 */
export async function fetchFigmaImages(
  fileKey: string,
  imageRefs: string[],
  accessToken: string
): Promise<Record<string, string>> {
  if (!fileKey || !accessToken) {
    console.warn('⚠️ Figma fileKey or accessToken missing - images will use placeholders');
    return {};
  }

  if (imageRefs.length === 0) {
    return {};
  }

  // WP32: Use correct endpoint for image fills
  // GET /v1/files/:key/images returns mapping of imageRef → URL
  const url = `https://api.figma.com/v1/files/${fileKey}/images`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data: FigmaImagesResponse = await response.json();

    if (data.err) {
      throw new Error(`Figma API error: ${data.err}`);
    }

    // WP32: API returns { meta: { images: { imageRef: URL } } }
    return data.meta?.images || data.images || {};
  } catch (error) {
    console.error('❌ Failed to fetch Figma images:', error);
    return {};
  }
}

/**
 * WP32: Download images from Figma API and return as buffers
 * Used during import to save images locally
 *
 * @param fileKey - Figma file key
 * @param imageRefs - Array of imageRef strings
 * @param nodeId - Node ID for filename generation
 * @param accessToken - Figma API access token
 * @returns Map of filename → image Buffer
 */
export async function downloadFigmaImages(
  fileKey: string,
  imageRefs: string[],
  nodeId: string,
  accessToken: string
): Promise<Record<string, Buffer>> {
  if (!fileKey || !accessToken || imageRefs.length === 0) {
    return {};
  }

  // First, get the URLs for all imageRefs
  const imageUrls = await fetchFigmaImages(fileKey, imageRefs, accessToken);

  const result: Record<string, Buffer> = {};

  // Download each image
  await Promise.all(
    imageRefs.map(async (imageRef) => {
      const imageUrl = imageUrls[imageRef];
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.warn(`⚠️ No URL found for imageRef ${imageRef}`);
        return;
      }

      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          // Filename format: nodeId_imageRef.png (matches what generators expect)
          const safeNodeId = nodeId.replace(/:/g, '-');
          const filename = `${safeNodeId}_${imageRef.substring(0, 8)}.png`;
          result[filename] = Buffer.from(arrayBuffer);
        }
      } catch (err) {
        console.warn(`⚠️ Failed to download image ${imageRef}:`, err);
      }
    })
  );

  return result;
}

/**
 * Extract image nodes from altNode tree
 * WP32: Now extracts ALL image refs from fillsData (multi-layer support)
 */
export function extractImageNodes(altNode: any): ImageNode[] {
  const imageNodes: ImageNode[] = [];
  const seenRefs = new Set<string>(); // Avoid duplicates

  function traverse(node: any) {
    // WP32: Extract from fillsData (all fills)
    if (node.fillsData) {
      for (const fill of node.fillsData) {
        if (fill.type === 'IMAGE' && fill.imageRef && !seenRefs.has(fill.imageRef)) {
          seenRefs.add(fill.imageRef);
          imageNodes.push({
            nodeId: node.id,
            imageRef: fill.imageRef
          });
        }
      }
    }
    // Fallback: also check imageData for backward compatibility
    else if (node.imageData && !seenRefs.has(node.imageData.imageRef)) {
      seenRefs.add(node.imageData.imageRef);
      imageNodes.push({
        nodeId: node.imageData.nodeId,
        imageRef: node.imageData.imageRef
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(altNode);
  return imageNodes;
}

/**
 * WP32: Vector node info for SVG extraction
 * Used by generators to create SVG files and imports
 */
interface VectorNode {
  nodeId: string;
  name: string;  // WP32: Figma node name for generating variable names (e.g., "Vector" → vector.svg)
  svgData: {
    fillGeometry?: Array<{ path: string; windingRule?: string }>;
    strokeGeometry?: Array<{ path: string; windingRule?: string }>;
    fills?: Array<{ type: string; color: { r: number; g: number; b: number; a: number } }>;
    strokes?: Array<{ type: string; color: { r: number; g: number; b: number; a: number } }>;
    strokeWeight?: number;
    bounds: { x: number; y: number; width: number; height: number };
  };
  isComplex: boolean;
}

/**
 * WP32: SVG container - a parent node with VECTOR children
 * These should be downloaded as a single SVG from Figma API (not path by path)
 *
 * Two types:
 * - INSTANCE: Reusable component with fixed bounds, content positioned inside
 * - FRAME/GROUP: Simple structure where container defines the SVG bounds
 */
export interface SvgContainerNode {
  nodeId: string;
  name: string;
  vectorCount: number;
  isInstance: boolean;  // true = INSTANCE component, false = FRAME/GROUP structure
  containerBounds: { width: number; height: number };  // Size of the container
}

/**
 * WP32: Extract SVG containers from altNode tree
 *
 * SVG container types:
 * 1. INSTANCE with VECTORs: Reusable component - keep container, replace content with img
 * 2. FRAME/GROUP with 2+ VECTORs: Simple structure - download as single SVG
 *
 * These containers should be downloaded as a single SVG file from Figma API
 * (not reconstructed path by path)
 */
export function extractSvgContainers(altNode: any): SvgContainerNode[] {
  const containers: SvgContainerNode[] = [];
  const processedIds = new Set<string>();

  function countVectorChildren(node: any): number {
    let count = 0;
    if (node.originalType === 'VECTOR') count++;
    if (node.children) {
      for (const child of node.children) {
        count += countVectorChildren(child);
      }
    }
    return count;
  }

  function hasNonVectorContent(node: any): boolean {
    if (node.originalType === 'TEXT') return true;
    if (node.fillsData?.some((f: any) => f.type === 'IMAGE')) return true;
    if (node.children) {
      for (const child of node.children) {
        if (hasNonVectorContent(child)) return true;
      }
    }
    return false;
  }

  // Extract width/height from node styles, with fallback to originalNode bounds
  function getNodeBounds(node: any): { width: number; height: number } {
    const styles = node.styles || {};
    const parseSize = (val: string | number | undefined): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    let width = parseSize(styles.width);
    let height = parseSize(styles.height);

    // WP32 FIX: If styles give 0 (e.g., 'auto'), use originalNode bounds as fallback
    // This ensures SVG containers always have proper dimensions
    if ((width === 0 || height === 0) && node.originalNode) {
      const orig = node.originalNode;
      // Try size first (actual dimensions before rotation)
      if (orig.size) {
        if (width === 0) width = orig.size.x || 0;
        if (height === 0) height = orig.size.y || 0;
      }
      // Fallback to absoluteBoundingBox
      if ((width === 0 || height === 0) && orig.absoluteBoundingBox) {
        if (width === 0) width = orig.absoluteBoundingBox.width || 0;
        if (height === 0) height = orig.absoluteBoundingBox.height || 0;
      }
    }

    return { width, height };
  }

  function traverse(node: any) {
    if (node.originalType === 'VECTOR') return;

    // WP32 FIX: Skip hidden nodes - Figma API refuses to export hidden elements as SVG
    if (node.visible === false) return;

    const vectorCount = countVectorChildren(node);
    const isInstance = node.originalType === 'INSTANCE';

    // WP32: SVG container conditions:
    // - INSTANCE with any VECTORs (even 1) → treat as SVG container
    // - FRAME/GROUP with 2+ VECTORs + no text/images → treat as SVG container
    const isSvgContainer =
      (isInstance && vectorCount >= 1 && !hasNonVectorContent(node)) ||
      (!isInstance && vectorCount >= 2 && !hasNonVectorContent(node));

    if (isSvgContainer && !processedIds.has(node.id)) {
      processedIds.add(node.id);
      containers.push({
        nodeId: node.id,
        name: node.name || 'svg',
        vectorCount,
        isInstance,
        containerBounds: getNodeBounds(node),
      });
      return; // Don't traverse children - this whole node is an SVG container
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(altNode);
  return containers;
}

/**
 * WP32: Fetch nodes rendered as SVG from Figma API
 * Uses GET /v1/images/:key?ids=nodeId&format=svg
 *
 * For complex SVG containers (logos, icons with multiple paths)
 */
export async function fetchNodesAsSVG(
  fileKey: string,
  nodeIds: string[],
  accessToken: string
): Promise<Record<string, string>> {
  if (!fileKey || !accessToken || nodeIds.length === 0) {
    return {};
  }

  const ids = nodeIds.join(',');
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=svg`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Figma-Token': accessToken }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.err) throw new Error(data.err);

    // API returns { images: { nodeId: svgUrl } }
    // Fetch actual SVG content from each URL
    const result: Record<string, string> = {};
    const svgUrls = data.images || {};

    await Promise.all(
      Object.entries(svgUrls).map(async ([nodeId, svgUrl]) => {
        if (svgUrl && typeof svgUrl === 'string') {
          try {
            const svgResponse = await fetch(svgUrl);
            if (svgResponse.ok) {
              result[nodeId] = await svgResponse.text();
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fetch SVG for ${nodeId}:`, err);
          }
        }
      })
    );

    console.log(`✅ Fetched ${Object.keys(result).length} SVGs from Figma API`);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch SVGs:', error);
    return {};
  }
}

/**
 * WP32: Get node IDs that are inside SVG containers
 * Used to skip individual VECTOR processing for nodes inside containers
 */
export function getNodesInsideSvgContainers(altNode: any, containers: SvgContainerNode[]): Set<string> {
  const containerIds = new Set(containers.map(c => c.nodeId));
  const insideIds = new Set<string>();

  function collectChildIds(node: any) {
    insideIds.add(node.id);
    if (node.children) {
      for (const child of node.children) {
        collectChildIds(child);
      }
    }
  }

  function traverse(node: any) {
    if (containerIds.has(node.id)) {
      // This is a container - collect all children IDs
      if (node.children) {
        for (const child of node.children) {
          collectChildIds(child);
        }
      }
      return;
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(altNode);
  return insideIds;
}

/**
 * WP32: Extract simple VECTOR nodes from altNode tree
 * Returns only VECTORs that are NOT inside SVG containers
 */
export function extractVectorNodes(altNode: any, skipNodeIds?: Set<string>): VectorNode[] {
  const vectorNodes: VectorNode[] = [];
  const seenIds = new Set<string>();

  function traverse(node: any) {
    // WP32: Skip if this node is inside an SVG container
    if (skipNodeIds?.has(node.id)) {
      if (node.children) node.children.forEach(traverse);
      return;
    }

    if (node.originalType === 'VECTOR' && node.svgData && !seenIds.has(node.id)) {
      seenIds.add(node.id);

      const fillCount = node.svgData.fillGeometry?.length ?? 0;
      const strokeCount = node.svgData.strokeGeometry?.length ?? 0;
      const isComplex = fillCount > 1 || strokeCount > 1;

      vectorNodes.push({
        nodeId: node.id,
        name: node.name || 'Vector',
        svgData: node.svgData,
        isComplex
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(altNode);
  return vectorNodes;
}
