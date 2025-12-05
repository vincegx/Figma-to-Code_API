/**
 * Export utilities for ZIP package generation
 * WP46: Convert API paths to relative paths for standalone export
 */

/**
 * Convert API image/SVG paths to relative paths for standalone export
 *
 * @param code - The generated code string
 * @param nodeId - The node ID (used in API paths)
 * @returns Code with paths converted to relative ../assets/ references
 *
 * @example
 * // Input: src="/api/images/425-2146/icon.svg"
 * // Output: src="../assets/svg/icon.svg"
 * // Input: src="/api/images/425-2146/photo.png"
 * // Output: src="../assets/images/photo.png"
 */
export function convertApiPathsToRelative(code: string, nodeId: string): string {
  // Escape nodeId for regex (handle special chars like dashes)
  const escapedNodeId = nodeId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  return code
    // /api/images/{nodeId}/{filename}.svg → ../assets/svg/{filename}.svg
    .replace(
      new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
      '../assets/svg/$1'
    )
    // /api/images/{nodeId}/{filename}.png/jpg/etc → ../assets/images/{filename}
    .replace(
      new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../assets/images/$1'
    )
    // /api/svg/{nodeId}/{filename} → ../assets/svg/{filename}
    .replace(
      new RegExp(`/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../assets/svg/$1'
    )
    // Handle potential full URL paths as well
    .replace(
      new RegExp(`http[s]?://[^/]+/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
      '../assets/svg/$1'
    )
    .replace(
      new RegExp(`http[s]?://[^/]+/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../assets/images/$1'
    )
    .replace(
      new RegExp(`http[s]?://[^/]+/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../assets/svg/$1'
    );
}

/**
 * Get file extension based on framework and language settings
 */
export function getCodeFileExtension(
  framework: string,
  language: 'typescript' | 'javascript'
): string {
  if (framework === 'html-css') {
    return 'html';
  }
  // React frameworks (react-tailwind, react-tailwind-v4, or any other React variant)
  return language === 'typescript' ? 'tsx' : 'jsx';
}

/**
 * Sanitize component name for file naming
 * Converts Figma node names to valid file names
 */
export function sanitizeComponentName(name: string): string {
  return name
    // Replace spaces and special chars with dashes
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    // Remove consecutive dashes
    .replace(/-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-|-$/g, '')
    // Ensure it starts with a letter (prepend 'Component' if needed)
    .replace(/^([^a-zA-Z])/, 'Component-$1');
}

/**
 * Convert component name to PascalCase for React components
 */
export function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
