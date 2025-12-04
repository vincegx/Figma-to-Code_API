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

    // WP38 Fix #23: Also extract maskImageRef for Figma mask pattern
    if (node.maskImageRef && !seenRefs.has(node.maskImageRef)) {
      seenRefs.add(node.maskImageRef);
      imageNodes.push({
        nodeId: node.id,
        imageRef: node.maskImageRef
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
 * WP32: Node to export as SVG from Figma API
 *
 * Simple rules:
 * - 1 VECTOR → export the VECTOR directly (compact SVG)
 * - 2+ VECTORs in a container → export the container (composite SVG)
 */
export interface SvgExportNode {
  nodeId: string;
  name: string;
  bounds: { width: number; height: number };
}

/**
 * WP32: Extract nodes to export as SVG from Figma API
 *
 * Simple logic based on what Figma API returns:
 * - Single VECTOR → export the VECTOR (gives compact SVG like 7x12)
 * - Multiple VECTORs in GROUP/FRAME → export the parent (gives composite SVG)
 */
export function extractSvgContainers(altNode: any): SvgExportNode[] {
  const nodesToExport: SvgExportNode[] = [];
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

  // Check if node has content that shouldn't be combined into one SVG
  function hasNonVectorContent(node: any): boolean {
    if (node.originalType === 'TEXT') return true;
    if (node.fillsData?.some((f: any) => f.type === 'IMAGE')) return true;
    // INSTANCE with layoutMode = container with children, not just icon
    if (node.originalType === 'INSTANCE' && node.originalNode?.layoutMode) return true;
    // FRAME/GROUP with SOLID fill but NO vector children = standalone shape (like Button background)
    if ((node.originalType === 'FRAME' || node.originalType === 'GROUP') &&
        node.fillsData?.some((f: any) => f.type === 'SOLID' && f.visible !== false) &&
        countVectorChildren(node) === 0) {
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (hasNonVectorContent(child)) return true;
      }
    }
    return false;
  }

  // Get bounds from originalNode (what Figma API will use for SVG export)
  function getNodeBounds(node: any): { width: number; height: number } {
    if (node.originalNode?.absoluteBoundingBox) {
      const box = node.originalNode.absoluteBoundingBox;
      return { width: box.width || 0, height: box.height || 0 };
    }
    return { width: 0, height: 0 };
  }

  function findSingleVector(node: any): any | null {
    if (node.originalType === 'VECTOR') return node;
    if (node.children?.length === 1) {
      return findSingleVector(node.children[0]);
    }
    return null;
  }

  function traverse(node: any) {
    if (node.visible === false) return;
    if (processedIds.has(node.id)) return;

    const vectorCount = countVectorChildren(node);

    // Case 1: This IS a VECTOR → export it directly
    if (node.originalType === 'VECTOR') {
      processedIds.add(node.id);
      nodesToExport.push({
        nodeId: node.id,
        name: node.name || 'vector',
        bounds: getNodeBounds(node),
      });
      return;
    }

    // Case 2: Container with 2+ VECTORs and no other content → export container
    if (vectorCount >= 2 && !hasNonVectorContent(node)) {
      processedIds.add(node.id);
      // Mark all children as processed too
      function markProcessed(n: any) {
        processedIds.add(n.id);
        n.children?.forEach(markProcessed);
      }
      markProcessed(node);

      nodesToExport.push({
        nodeId: node.id,
        name: node.name || 'svg',
        bounds: getNodeBounds(node),
      });
      return;
    }

    // Case 3: Container with exactly 1 VECTOR → find and export the VECTOR directly
    if (vectorCount === 1 && !hasNonVectorContent(node)) {
      const singleVector = findSingleVector(node);
      if (singleVector && !processedIds.has(singleVector.id)) {
        processedIds.add(singleVector.id);
        nodesToExport.push({
          nodeId: singleVector.id,
          name: singleVector.name || 'vector',
          bounds: getNodeBounds(singleVector),
        });
      }
      // Continue traversing in case there are other branches
    }

    // Traverse children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(altNode);
  return nodesToExport;
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

