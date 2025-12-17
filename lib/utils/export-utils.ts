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

/**
 * Extract the exported component name from React code
 * Handles: export function Name(), export const Name =, export default function Name()
 */
export function extractExportedComponentName(code: string): string | null {
  // Match: export function ComponentName(
  const namedFunctionMatch = code.match(/export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
  if (namedFunctionMatch) {
    return namedFunctionMatch[1];
  }

  // Match: export const ComponentName =
  const constMatch = code.match(/export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/);
  if (constMatch) {
    return constMatch[1];
  }

  // Match: export default function ComponentName(
  const defaultFunctionMatch = code.match(/export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
  if (defaultFunctionMatch) {
    return defaultFunctionMatch[1];
  }

  return null;
}

/**
 * Custom breakpoints for Tailwind configuration
 * These match the responsive design logic:
 * - mobileWidth: the width where tablet styles start (md: breakpoint)
 * - tabletWidth: the width where desktop styles start (lg: breakpoint)
 */
export interface CustomBreakpoints {
  mobileWidth?: number;  // md breakpoint - tablet styles start here (default: 480)
  tabletWidth?: number;  // lg breakpoint - desktop styles start here (default: 960)
}

/**
 * Add Vite project files to ZIP for running a dev server (React exports only)
 * Allows `npm install && npm run dev` to test the exported component
 *
 * @param componentName - The file name for the component (without extension)
 * @param exportedComponentName - The actual exported function/const name in the code (if different from componentName)
 */
export function addViteProjectFiles(
  zip: { file: (path: string, content: string) => void },
  componentName: string,
  extension: string,
  projectName: string,
  googleFontsUrl?: string,
  breakpoints?: CustomBreakpoints,
  framework: 'react-tailwind' | 'react-tailwind-v4' = 'react-tailwind',
  exportedComponentName?: string
): void {
  // Use the actual exported name if provided, otherwise use the file name
  const actualComponentName = exportedComponentName || componentName;
  const isTypeScript = extension === 'tsx';
  const mainExt = isTypeScript ? 'tsx' : 'jsx';
  const isV4 = framework === 'react-tailwind-v4';

  // package.json - different deps for v3 (CDN) vs v4 (npm)
  const packageJson = {
    name: sanitizeComponentName(projectName).toLowerCase() || 'figma-export',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.0',
      vite: '^5.0.0',
      ...(isV4
        ? {
            tailwindcss: '^4.0.0',
            '@tailwindcss/vite': '^4.0.0',
          }
        : {}),
      ...(isTypeScript
        ? {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            typescript: '^5.3.0',
          }
        : {}),
    },
  };
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // vite.config.js - add tailwind plugin for v4
  const viteConfig = isV4
    ? `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`
    : `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
  zip.file('vite.config.js', viteConfig);

  // Google Fonts link (if provided)
  const googleFontsLink = googleFontsUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${googleFontsUrl}" rel="stylesheet">`
    : '';

  // Breakpoints logic matches generate-tailwind-css API:
  // - md: mobileWidth (where tablet styles start)
  // - lg: tabletWidth (where desktop styles start)
  const hasCustomBreakpoints = breakpoints && (breakpoints.mobileWidth || breakpoints.tabletWidth);
  const mobileWidth = breakpoints?.mobileWidth || 480;
  const tabletWidth = breakpoints?.tabletWidth || 960;

  if (isV4) {
    // Tailwind v4: Create CSS file with @theme for custom breakpoints
    const tailwindCSS = `@import "tailwindcss";
${hasCustomBreakpoints ? `
@theme {
  --breakpoint-sm: ${mobileWidth}px;
  --breakpoint-md: ${mobileWidth}px;
  --breakpoint-lg: ${tabletWidth}px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
` : ''}`;
    zip.file('src/index.css', tailwindCSS);

    // index.html for v4 (no CDN, CSS imported in main.tsx)
    const indexHtmlV4 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    ${googleFontsLink}
    <style>
      /* Make root responsive instead of fixed Figma width */
      #root > * {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${mainExt}"></script>
  </body>
</html>
`;
    zip.file('index.html', indexHtmlV4);
  } else {
    // Tailwind v3: Use CDN with inline config
    const tailwindConfig = hasCustomBreakpoints
      ? `
    <script>
      tailwind.config = {
        theme: {
          screens: {
            'sm': '${mobileWidth}px',
            'md': '${mobileWidth}px',
            'lg': '${tabletWidth}px',
            'xl': '1280px',
            '2xl': '1536px',
          }
        }
      }
    </script>`
      : '';

    const indexHtmlV3 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    ${googleFontsLink}
    <script src="https://cdn.tailwindcss.com"></script>${tailwindConfig}
    <style>
      /* Make root responsive instead of fixed Figma width */
      #root > * {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${mainExt}"></script>
  </body>
</html>
`;
    zip.file('index.html', indexHtmlV3);
  }

  // src/main.tsx or src/main.jsx - import CSS for v4
  const cssImport = isV4 ? "import './index.css';\n" : '';
  const mainContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
${cssImport}import { ${actualComponentName} } from './${componentName}';

ReactDOM.createRoot(document.getElementById('root')${isTypeScript ? '!' : ''}).render(
  <React.StrictMode>
    <${actualComponentName} />
  </React.StrictMode>
);
`;
  zip.file(`src/main.${mainExt}`, mainContent);

  // tsconfig.json (TypeScript only)
  if (isTypeScript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
    };
    zip.file('tsconfig.json', JSON.stringify(tsConfig, null, 2));
  }
}
