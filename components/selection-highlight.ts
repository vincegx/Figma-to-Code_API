/**
 * Selection Highlight System for Viewer
 *
 * Provides CSS styles and JavaScript for highlighting selected elements
 * in the LivePreview iframe with a border and label.
 */

export const HIGHLIGHT_STYLES = `
[data-highlight="true"] {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px;
  position: relative;
}
[data-highlight="true"]::before {
  content: attr(data-highlight-label);
  position: absolute;
  top: -24px;
  left: 0;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 9999;
  font-family: system-ui, -apple-system, sans-serif;
  pointer-events: none;
}
`;

export const HIGHLIGHT_SCRIPT = `
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'highlight') {
    // Remove previous highlights
    document.querySelectorAll('[data-highlight]').forEach(function(el) {
      el.removeAttribute('data-highlight');
      el.removeAttribute('data-highlight-label');
    });

    if (e.data.enabled && e.data.nodeId) {
      var target = document.querySelector('[data-node-id="' + e.data.nodeId + '"]');
      if (target) {
        target.setAttribute('data-highlight', 'true');
        var label = (e.data.isInstance ? '◆ ' : '') + e.data.nodeName + ' (' + e.data.nodeId + ')';
        target.setAttribute('data-highlight-label', label);
      }
    }
  }
});
`;

/**
 * Build the highlight label string
 */
export function buildHighlightLabel(name: string, nodeId: string, isInstance: boolean): string {
  return isInstance ? `◆ ${name} (${nodeId})` : `${name} (${nodeId})`;
}
