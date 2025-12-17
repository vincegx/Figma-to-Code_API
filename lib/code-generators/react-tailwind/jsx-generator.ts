/**
 * JSX Generator for React-Tailwind
 *
 * Generates React JSX with Tailwind CSS classes from AltNode trees.
 * VERBATIM from react-tailwind.ts
 */

import type { SimpleAltNode, FillData } from '../../altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '../../types/rules';
import { cssPropToTailwind, extractTextContent, extractComponentDataAttributes, scaleModeToTailwind, truncateLayerName } from '../helpers';
import { evaluateMultiFrameworkRules } from '../../rule-engine';
import { vectorToDataURL } from '../../utils/svg-converter';
import { getVisibilityClasses } from '../../merge/visibility-mapper';
import { smartSplitTailwindClasses, deduplicateTailwindClasses } from './class-processing';
import { generateSvgFilename } from '../../utils/image-fetcher';

/**
 * WP32: Convert FillData gradient to CSS gradient string
 * Applies fill opacity to gradient stop colors (like MCP does)
 */
function fillDataToGradientCSS(fill: FillData): string {
  if (!fill.gradientStops) return '';

  // WP32: Apply fill opacity to each stop's alpha
  const fillOpacity = fill.opacity ?? 1;

  const stops = fill.gradientStops
    .map(stop => {
      const { r, g, b, a = 1 } = stop.color;
      // Multiply color alpha by fill opacity
      const finalAlpha = a * fillOpacity;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha}) ${Math.round(stop.position * 100)}%`;
    })
    .join(', ');

  // Calculate angle from gradient handles if available
  let angle = 180; // Default: top to bottom
  if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
    const [start, end] = fill.gradientHandlePositions;
    angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90);
  }

  if (fill.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * WP32: Convert FillData solid color to CSS rgba string
 * Applies fill opacity to color alpha (like MCP does)
 */
function fillDataToColorCSS(fill: FillData): string {
  if (!fill.color) return '';
  const { r, g, b, a = 1 } = fill.color;
  // WP32: Multiply color alpha by fill opacity
  const fillOpacity = fill.opacity ?? 1;
  const finalAlpha = a * fillOpacity;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
}

/**
 * Filter out properties with unresolved variables or empty values
 * @param props - Raw resolved properties from rule evaluation
 * @returns Cleaned properties without $value placeholders
 */
export function cleanResolvedProperties(props: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    // Ensure value is a string
    const stringValue = String(value);

    // Skip properties with unresolved variables
    if (stringValue.includes('$value') || stringValue.includes('${')) {
      continue;
    }
    // Skip empty values
    if (!stringValue || stringValue.trim() === '') {
      continue;
    }
    cleaned[key] = stringValue;
  }

  return cleaned;
}

/**
 * Map Figma node type to HTML tag
 */
function mapNodeTypeToHTMLTag(nodeType: string): string {
  const mapping: Record<string, string> = {
    FRAME: 'div',
    RECTANGLE: 'div',
    TEXT: 'span',
    GROUP: 'div',
    COMPONENT: 'div',
    INSTANCE: 'div',
    VECTOR: 'svg',
    ELLIPSE: 'div',
  };

  return mapping[nodeType] || 'div';
}

/**
 * WP25 T183: Determine if a node should render as <img> tag vs background-image
 *
 * WP32 FIX: Use imageData as primary criteria (set by altnode-transform)
 * Use <img> if:
 * - Node has imageData with imageRef (from altnode-transform)
 * - OR node has image fill AND no children
 */
function shouldRenderAsImgTag(node: SimpleAltNode): boolean {
  // WP32: Primary check - imageData is set by altnode-transform for image fills
  if (node.imageData?.imageRef) {
    return true;
  }

  // Fallback: Check originalNode fills (for backward compatibility)
  const hasImageFill = (node.originalNode as any)?.fills?.some(
    (fill: any) => fill.type === 'IMAGE'
  );
  const hasNoChildren = !node.children || node.children.length === 0;

  return hasImageFill && hasNoChildren;
}

/**
 * WP25 T183: Extract image URL from node
 *
 * Returns imageRef from fills or null
 */
function extractImageUrl(node: SimpleAltNode): string | null {
  const fills = (node.originalNode as any)?.fills || [];
  const imageFill = fills.find((fill: any) => fill.type === 'IMAGE');

  if (imageFill && imageFill.imageRef) {
    return imageFill.imageRef;
  }

  return null;
}

/**
 * Generate React Tailwind JSX for a single node (recursive)
 *
 * This is the main recursive function that generates JSX elements
 * with Tailwind classes for each node in the tree.
 *
 * @param node - The AltNode to generate JSX for
 * @param properties - Resolved CSS properties from rules
 * @param depth - Current nesting depth (for indentation)
 * @param allRules - All rules for child evaluation
 * @param framework - Target framework
 * @param imageUrls - Map of imageRef → URL
 * @param svgMap - Map of nodeId → SVG varName or data URL
 * @param isViewerMode - Whether in viewer mode (inline data URLs)
 * @param svgBoundsMap - Map of nodeId → SVG dimensions
 * @param parentNegativeSpacing - WP31: Negative spacing from parent
 * @param isLastChild - WP31: Whether this is the last child (no margin needed)
 * @param propLookup - WP47: Map of layerName → propName for props mode
 * @returns JSX string with Tailwind classes
 */
export function generateTailwindJSXElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind',
  imageUrls: Record<string, string> = {},
  svgMap: Record<string, string> = {},  // WP32: nodeId → varName (export) or data URL (viewer)
  isViewerMode: boolean = false,  // WP32: true = data URLs inline, false = import variables
  svgBoundsMap: Map<string, { width: number; height: number }> = new Map(),
  parentNegativeSpacing?: { value: number; direction: 'row' | 'column' },  // WP31: From parent
  isLastChild: boolean = false,  // WP31: Last child doesn't need margin
  propLookup: Map<string, { propName: string; type: 'text' | 'image' }> = new Map(),  // WP47: Props lookup
  stubNodes: Map<string, string> = new Map()  // Split export: nodeId → ComponentName to render as <Component />
): string {
  // WP32: Skip hidden nodes - but NOT if they have partial visibility (responsive merge)
  // If node.presence exists with at least one true, render it with visibility classes
  const hasPartialVisibility = node.presence && (node.presence.mobile || node.presence.tablet || node.presence.desktop);
  if (node.visible === false && !hasPartialVisibility) {
    return '';
  }

  const indent = '  '.repeat(depth + 1);

  // Split export: If this node should be stubbed, render as component reference
  const stubComponentName = stubNodes.get(node.id);
  if (stubComponentName) {
    return `${indent}<${stubComponentName} />\n`;
  }

  // WP32: Handle SVG nodes (VECTORs or multi-VECTOR containers)
  const svgBounds = svgBoundsMap.get(node.id);
  if (svgBounds) {
    // Use node.sourceNodeId if available (for merged nodes with different breakpoint sources)
    let svgValue = svgMap[node.id];
    if (isViewerMode && node.sourceNodeId) {
      const filename = generateSvgFilename(node.name, node.id);
      svgValue = `/api/images/${node.sourceNodeId}/${filename}`;
    }
    const altText = node.name || 'svg';

    // WP32 DEBUG

    // Build data attributes
    // WP38: Truncate long layer names (TEXT nodes often use full text content)
    const componentAttrs = extractComponentDataAttributes(node);
    const allDataAttrs = {
      'data-layer': truncateLayerName(node.name),
      'data-node-id': node.id,
      ...componentAttrs
    };
    const dataAttrString = Object.entries(allDataAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    // Simple: img with SVG dimensions from Figma API
    // WP31: Respect width/height from AltNode styles (e.g., 100% from FILL) over fixed pixel bounds
    const nodeWidth = node.styles?.width;
    const nodeHeight = node.styles?.height;
    const { width, height } = svgBounds;

    // Use percentage width/height if specified, otherwise use fixed pixel dimensions
    const widthClass = (typeof nodeWidth === 'string' && nodeWidth.includes('%'))
      ? cssPropToTailwind('width', nodeWidth)
      : (width > 0 ? `w-[${Math.round(width)}px]` : '');
    const heightClass = (typeof nodeHeight === 'string' && nodeHeight.includes('%'))
      ? cssPropToTailwind('height', nodeHeight)
      : (height > 0 ? `h-[${Math.round(height)}px]` : '');
    const sizeClasses = [widthClass, heightClass].filter(Boolean).join(' ');

    // WP31: Include positioning and visual styles for SVG containers
    // position/top/left needed for free-positioned SVGs in frames without layoutMode
    const positioningStyles = ['position', 'top', 'left', 'right', 'bottom', 'grid-area', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom', 'opacity'];
    const nodeStyleClasses = Object.entries(node.styles || {})
      .filter(([prop]) => positioningStyles.includes(prop))
      .map(([prop, value]) => cssPropToTailwind(prop, String(value)))
      .filter(Boolean)
      .join(' ');
    const allClasses = ['block', 'max-w-none', sizeClasses, nodeStyleClasses].filter(Boolean).join(' ');

    if (svgValue) {
      const imgSrc = isViewerMode ? `"${svgValue}"` : `{${svgValue}}`;
      return `${indent}<img ${dataAttrString} className="${allClasses}" alt="${altText}" src=${imgSrc} />\n`;
    }
    return `${indent}<div ${dataAttrString} className="${allClasses}" />\n`;
  }

  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping

  // T178: Add data-layer attribute
  // T180: Extract component properties as data-* attributes
  // WP31: Add data-node-id for node-by-node comparison with MCP reference
  // WP38: Truncate long layer names (TEXT nodes often use full text content)
  const componentAttrs = extractComponentDataAttributes(node);
  const allDataAttrs = {
    'data-layer': truncateLayerName(node.name), // T178: Original Figma name (truncated)
    'data-node-id': node.id, // WP31: Figma node ID for comparison
    ...componentAttrs // T180: Component properties
  };

  const dataAttrString = Object.entries(allDataAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  // Merge base styles from AltNode with rule overrides
  // Rules take precedence over computed styles
  // Convert node.styles values to strings if needed
  const baseStyles: Record<string, string> = {};
  const hasChildren = 'children' in node && node.children.length > 0;
  const hasFlex = node.styles?.display === 'flex' || node.styles?.display === 'inline-flex';

  for (const [key, value] of Object.entries(node.styles || {})) {
    // WP31: MCP garde le height même sur flex containers - on fait pareil
    baseStyles[key] = typeof value === 'number' ? String(value) : value;
  }

  const mergedStyles: Record<string, string> = {
    ...baseStyles,
    ...properties,
  };

  // WP25 FIX: Merge classes from rules AND base styles
  let tailwindClasses: string;

  // Convert base styles to Tailwind classes
  const baseClasses = Object.entries(baseStyles)
    .filter(([key]) => key !== 'className') // Skip className in baseStyles
    .map(([cssProperty, cssValue]) => cssPropToTailwind(cssProperty, cssValue))
    .filter(Boolean);

  // WP08: Add responsive classes from responsiveStyles (md: and lg: prefixes)
  // Note: cssPropToTailwind may return multiple classes (e.g., "border border-[color] border-solid")
  // We need to prefix EACH class with md: or lg:
  // Use smartSplitTailwindClasses to handle arbitrary values with spaces inside brackets
  const responsiveClasses: string[] = [];

  // Helper to process responsive styles for a breakpoint
  // FIX: When flex-grow is present with w-auto, use basis-0 instead
  // This fixes Tailwind CDN issue where w-full md:w-auto doesn't work correctly
  const processResponsiveStyles = (styles: Record<string, string | number>, prefix: 'md' | 'lg') => {
    const hasFlexGrow = styles['flex-grow'] === '1' || styles['flex-grow'] === 1;

    for (const [cssProperty, cssValue] of Object.entries(styles)) {
      // Skip width:auto when flex-grow is present - we'll add basis-0 instead
      if (cssProperty === 'width' && cssValue === 'auto' && hasFlexGrow) {
        responsiveClasses.push(`${prefix}:basis-0`);
        continue;
      }

      const twClass = cssPropToTailwind(cssProperty, String(cssValue));
      if (twClass) {
        // Smart split to preserve arbitrary values, then prefix each class
        const classes = smartSplitTailwindClasses(twClass);
        for (const cls of classes) {
          responsiveClasses.push(`${prefix}:${cls}`);
        }
      }
    }
  };

  if (node.responsiveStyles?.md) {
    processResponsiveStyles(node.responsiveStyles.md, 'md');
  }
  if (node.responsiveStyles?.lg) {
    processResponsiveStyles(node.responsiveStyles.lg, 'lg');
  }

  // WP31: Add MCP-style structural classes
  const structuralClasses: string[] = [];

  // Add visibility classes for partial visibility (mobile-only, tablet-only, etc.)
  // This ensures elements are hidden/shown at correct breakpoints
  if (node.presence) {
    let visibilityClasses = getVisibilityClasses(node.presence);
    if (visibilityClasses) {
      // Fix: replace "block" with "flex" for flex containers to preserve layout
      const isFlexContainer = node.styles?.display === 'flex' || node.styles?.display === 'inline-flex';
      if (isFlexContainer) {
        visibilityClasses = visibilityClasses.replace(/md:block/g, 'md:flex').replace(/lg:block/g, 'lg:flex');
      }
      // Split visibility classes and add them (e.g., "hidden md:flex" → ["hidden", "md:flex"])
      structuralClasses.push(...visibilityClasses.split(/\s+/).filter(Boolean));
    }
  }

  // MCP adds these utility classes systematically
  structuralClasses.push('box-border'); // Ensure box-sizing: border-box
  structuralClasses.push('content-stretch'); // MCP custom utility

  // Add relative for positioned elements (like MCP), unless already absolute
  // WP31: Skip relative for GROUP children (grid-area stacking) - relative creates stacking context issues
  const isGridChild = node.styles?.['grid-area'];
  if (node.originalType !== 'TEXT' && node.styles?.position !== 'absolute' && !isGridChild) {
    structuralClasses.push('relative');
  }

  // Add shrink-0 for flex items (MCP adds it almost everywhere)
  structuralClasses.push('shrink-0');

  // WP31: Add negative margin from parent's negative itemSpacing
  // This replaces invalid gap-[-Xpx] with valid mr-[-Xpx] or mb-[-Xpx]
  if (parentNegativeSpacing && !isLastChild) {
    const marginClass = parentNegativeSpacing.direction === 'row'
      ? `mr-[${parentNegativeSpacing.value}px]`
      : `mb-[${parentNegativeSpacing.value}px]`;
    structuralClasses.push(marginClass);
  }

  // WP31: Add flex centering for icon containers (fixed size with SVG children)
  const hasVectorChildren = 'children' in node && node.children.some(
    (child: SimpleAltNode) => child.originalType === 'VECTOR' || child.svgData
  );
  const hasFixedSize = node.styles?.width && node.styles?.height;
  const displayValue = String(node.styles?.display || '');
  const isNotFlexContainer = !displayValue.includes('flex');
  if (hasVectorChildren && hasFixedSize && isNotFlexContainer) {
    structuralClasses.push('flex', 'items-center', 'justify-center');
  }

  if (properties.className) {
    // WP28 T211: Rules come LAST so they override fallback base classes
    // This ensures semantic classes from rules (text-sm) beat raw fallbacks (text-[14px])
    // Architecture: fallbacks provide CSS guarantee → rules optimize to semantic classes
    let ruleClasses = properties.className.split(/\s+/).filter(Boolean);

    // WP31 FIX: Filter out rule classes that conflict with responsive overrides
    // When we have md:grow-0 (responsive reset), don't add grow/basis-0/flex-grow from rules
    // because unprefixed classes apply to ALL breakpoints, breaking responsive behavior
    const hasResponsiveGrowReset = responsiveClasses.some(c => c.includes(':grow-0'));
    if (hasResponsiveGrowReset) {
      ruleClasses = ruleClasses.filter(c => c !== 'grow' && c !== 'basis-0' && c !== 'flex-grow');
    }

    // WP08: Include responsive classes (md:, lg:) after base classes
    const allClasses = [...structuralClasses, ...baseClasses, ...responsiveClasses, ...ruleClasses];

    // WP28 T211: Deduplicate classes with correct priority
    // Rules win: text-sm overrides text-[14px], flex-col overrides flex-column
    // Last occurrence wins in deduplicateTailwindClasses(), so rules (last) beat fallbacks (first)
    let uniqueClasses = deduplicateTailwindClasses(allClasses);

    // WP38: Remove self-stretch when max-width is present (like MCP)
    // Elements with max-width should be centered by parent's items-center, not stretched
    const hasMaxWidth = uniqueClasses.some(c => c.startsWith('max-w-'));
    if (hasMaxWidth) {
      uniqueClasses = uniqueClasses.filter(c => c !== 'self-stretch');
    }

    tailwindClasses = uniqueClasses.join(' ');
  } else {
    // No rules - just use structural + base classes (fallbacks)
    // WP08: Include responsive classes (md:, lg:) after base classes
    const allClasses = [...structuralClasses, ...baseClasses, ...responsiveClasses];
    tailwindClasses = allClasses.join(' ');
  }

  const hasClasses = tailwindClasses.length > 0;

  // Generate JSX
  let jsxString = '';

  // T177 CRITICAL FIX: TEXT nodes MUST use text content, not children
  // TEXT nodes in Figma can have children (for styling spans) but we want the raw text
  if (node.originalType === 'TEXT') {
    // T185: Use extractTextContent to preserve line breaks
    const content = extractTextContent(node);

    // WP47: Check if this text node should use a prop (lookup by nodeId)
    const textProp = propLookup.get(node.id);
    const usesProp = textProp && textProp.type === 'text';

    if (content) {
      if (usesProp) {
        // Use prop reference instead of hardcoded content
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>{${textProp.propName}}</${htmlTag}>`;
      } else {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>${content}</${htmlTag}>`;
      }
    } else {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}></${htmlTag}>`;
    }
  } else if (node.originalType === 'VECTOR' && node.svgData) {
    // WP32: SVG rendering - viewer mode uses data URLs, export mode uses import variables
    let svgValue = svgMap[node.id];
    // Use node.sourceNodeId if available (for merged nodes with different breakpoint sources)
    if (isViewerMode && node.sourceNodeId) {
      const filename = generateSvgFilename(node.name, node.id);
      svgValue = `/api/images/${node.sourceNodeId}/${filename}`;
    }
    const altText = node.name || 'vector';
    // Extract width/height from node.styles for proper sizing (JSX style object)
    const width = node.styles?.width || '';
    const height = node.styles?.height || '';
    const sizeStyle = (width && height) ? ` style={{ width: '${width}', height: '${height}' }}` : '';

    if (svgValue) {
      if (isViewerMode) {
        // WP32: Viewer mode - inline data URL with dimensions
        jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src="${svgValue}" />`;
      } else {
        // WP32: Export mode - use variable reference for clean imports
        jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src={${svgValue}} />`;
      }
    } else {
      // Fallback: inline data URL
      const svgDataUrl = vectorToDataURL(node.svgData);
      jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src="${svgDataUrl}" />`;
    }
  } else if (node.fillsData && node.fillsData.length > 0) {
    // WP32: Multi-fill rendering - render ALL fills as stacked layers like MCP
    const hasChildren = 'children' in node && node.children.length > 0;
    const hasMultipleFills = node.fillsData.length > 1;
    const hasImageFill = node.fillsData.some((f: FillData) => f.type === 'IMAGE');

    // If multiple fills OR has image fill with children, use layered rendering
    if (hasMultipleFills || (hasImageFill && hasChildren)) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

      // Render all fills as stacked layers (decorative, hidden from screen readers)
      // WP31 FIX: Add rounded-[inherit] only if parent has border-radius
      const hasBorderRadius = node.styles['border-radius'] && node.styles['border-radius'] !== '0px';
      const inheritRadius = hasBorderRadius ? ' overflow-hidden rounded-[inherit]' : '';
      const childInheritRadius = hasBorderRadius ? ' rounded-[inherit]' : '';
      jsxString += `${indent}  <div aria-hidden="true" className="absolute inset-0 pointer-events-none${inheritRadius}">\n`;

      for (const fill of node.fillsData) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          const imageUrl = imageUrls[fill.imageRef] || `https://placehold.co/300x200`;
          // WP32: Use scaleMode for object-fit class
          const objectFitClass = scaleModeToTailwind(fill.scaleMode);
          jsxString += `${indent}    <img alt="" className="absolute inset-0 w-full h-full ${objectFitClass}${childInheritRadius}" src="${imageUrl}" />\n`;
        } else if (fill.type === 'SOLID') {
          const colorCSS = fillDataToColorCSS(fill);
          jsxString += `${indent}    <div className="absolute inset-0${childInheritRadius}" style={{ backgroundColor: "${colorCSS}" }} />\n`;
        } else if (fill.type.startsWith('GRADIENT')) {
          const gradientCSS = fillDataToGradientCSS(fill);
          jsxString += `${indent}    <div className="absolute inset-0${childInheritRadius}" style={{ backgroundImage: "${gradientCSS}" }} />\n`;
        }
      }

      jsxString += `${indent}  </div>\n`;

      // Render children (position:relative comes from altnode-transform)
      if (hasChildren) {
        // WP31: Prepare negative spacing for children
        const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
          ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
          : undefined;
        const childrenArray = (node as any).children;
        for (let i = 0; i < childrenArray.length; i++) {
          const child = childrenArray[i];
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          const isLast = i === childrenArray.length - 1;
          jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup, stubNodes);
        }
      }

      jsxString += `${indent}</${htmlTag}>`;
    } else if (hasImageFill && !hasChildren) {
      // Single image fill without children - simple img tag
      // WP32: Add object-fit based on scaleMode (FILL → object-cover, FIT → object-contain)
      const imageFill = node.fillsData.find((f: FillData) => f.type === 'IMAGE');
      const imageUrl = imageUrls[imageFill?.imageRef || ''] || 'https://placehold.co/300x200';
      const altText = node.name || 'image';
      const objectFitClass = scaleModeToTailwind(imageFill?.scaleMode);
      const imgClasses = hasClasses ? `${tailwindClasses} ${objectFitClass}` : objectFitClass;

      // WP47: Check if this image node should use a prop (lookup by nodeId)
      const imageProp = propLookup.get(node.id);
      const usesImageProp = imageProp && imageProp.type === 'image';

      if (usesImageProp) {
        jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src={${imageProp.propName}} />`;
      } else {
        jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src="${imageUrl}" />`;
      }
    } else {
      // Single non-image fill (solid/gradient) - render as div with background
      const fill = node.fillsData[0];
      const styleProps: string[] = [];
      if (fill.type === 'SOLID') {
        styleProps.push(`backgroundColor: "${fillDataToColorCSS(fill)}"`);
      } else if (fill.type.startsWith('GRADIENT')) {
        styleProps.push(`backgroundImage: "${fillDataToGradientCSS(fill)}"`);
      }

      // WP38 Fix #23: Apply mask-image for Figma mask pattern
      if (node.maskImageRef) {
        const maskUrl = imageUrls[node.maskImageRef] || '';
        if (maskUrl) {
          styleProps.push(`WebkitMaskImage: "url('${maskUrl}')"`);
          styleProps.push(`maskImage: "url('${maskUrl}')"`);
          styleProps.push(`WebkitMaskSize: "contain"`);
          styleProps.push(`maskSize: "contain"`);
          styleProps.push(`WebkitMaskRepeat: "no-repeat"`);
          styleProps.push(`maskRepeat: "no-repeat"`);
          styleProps.push(`WebkitMaskPosition: "center"`);
          styleProps.push(`maskPosition: "center"`);
        }
      }

      const styleString = styleProps.join(', ');

      if (hasChildren) {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} style={{ ${styleString} }}>\n`;
        // WP31: Prepare negative spacing for children
        const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
          ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
          : undefined;
        const childrenArray = (node as any).children;
        for (let i = 0; i < childrenArray.length; i++) {
          const child = childrenArray[i];
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          const isLast = i === childrenArray.length - 1;
          jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup, stubNodes);
        }
        jsxString += `${indent}</${htmlTag}>`;
      } else {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} style={{ ${styleString} }} />`;
      }
    }
  } else if (shouldRenderAsImgTag(node)) {
    // WP32: Fallback for backward compatibility - single image without fillsData
    const imageUrl = imageUrls[node.imageData?.imageRef || ''] || extractImageUrl(node) || 'https://placehold.co/300x200';
    const altText = node.name || 'image';
    const objectFitClass = scaleModeToTailwind(node.imageData?.scaleMode);
    const imgClasses = hasClasses ? `${tailwindClasses} ${objectFitClass}` : objectFitClass;

    // WP47: Check if this image node should use a prop (lookup by nodeId)
    const imageProp = propLookup.get(node.id);
    const usesImageProp = imageProp && imageProp.type === 'image';

    if (usesImageProp) {
      jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src={${imageProp.propName}} />`;
    } else {
      jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src="${imageUrl}" />`;
    }
  } else {
    // Non-TEXT, Non-VECTOR, Non-IMAGE nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

      // WP31: Prepare negative spacing for children
      const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
        ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
        : undefined;
      const childrenArray = (node as any).children;
      for (let i = 0; i < childrenArray.length; i++) {
        const child = childrenArray[i];
        // Evaluate rules for this child
        const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
        const childProps = cleanResolvedProperties(childResult.properties);
        const isLast = i === childrenArray.length - 1;

        jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup, stubNodes);
      }

      jsxString += `${indent}</${htmlTag}>`;
    } else {
      // Empty leaf node
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} />`;
    }
  }

  return jsxString + '\n';
}
