'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FrameworkType } from '@/lib/types/rules';

/**
 * LivePreview Security Model:
 * - sandbox="allow-scripts": Permits JavaScript execution ONLY
 * - NO allow-same-origin: Prevents access to parent window/cookies/localStorage
 * - NO allow-forms: Blocks form submission
 * - NO allow-popups: Prevents window.open() attacks
 * - referrerPolicy="no-referrer": Hides origin from external requests
 * - allow="": Disables all Permissions API features (camera, microphone, etc.)
 */

interface LivePreviewProps {
  code: string;
  framework: FrameworkType;
  language: 'html' | 'tsx' | 'jsx' | 'typescript' | 'css';
}

/**
 * Get rendering strategy based on framework type
 */
function getRenderingStrategy(framework: FrameworkType): 'html' | 'react' | 'none' {
  switch (framework) {
    case 'html-css':
      return 'html';
    case 'react-tailwind':
    case 'react-inline':
      return 'react';
    case 'swift-ui':
    case 'android-xml':
    default:
      return 'none';
  }
}

/**
 * Build complete HTML document from generated HTML/CSS code
 */
function buildHTMLDocument(code: string): string {
  // Split generated code on '/* CSS */' marker
  const parts = code.split('/* CSS */');
  const html = parts[0]?.trim() || '';
  const css = parts[1]?.trim() || '';

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
      }
      ${css}
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>
  `.trim();
}

/**
 * Build React document with server-transpiled code
 * Inlines React, ReactDOM, and Tailwind CSS to avoid CORS issues in srcDoc iframe
 */
function buildReactDocument(
  transpiledCode: string,
  componentName: string,
  reactCode: string,
  reactDomCode: string,
  tailwindCSS: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 16px;
      }
      ${tailwindCSS}
    </style>
  </head>
  <body>
    <div id="root"></div>

    <!-- React and ReactDOM inlined to avoid CORS issues -->
    <script>
      ${reactCode}
    </script>
    <script>
      ${reactDomCode}
    </script>

    <!-- Component code (transpiled on server) -->
    <script>
      ${transpiledCode}

      // Render component
      try {
        const ComponentToRender = window.${componentName} || ${componentName};
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(ComponentToRender));
      } catch (err) {
        window.parent.postMessage({
          type: 'error',
          message: err.message,
          stack: err.stack
        }, '*');
        throw err;
      }

      // Send errors to parent window
      window.addEventListener('error', (event) => {
        window.parent.postMessage({
          type: 'error',
          message: event.message,
          stack: event.error?.stack
        }, '*');
      });
    </script>
  </body>
</html>
  `.trim();
}

export default function LivePreview({ code, framework, language }: LivePreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeContent, setIframeContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const strategy = getRenderingStrategy(framework);

  // Transpile React code on server and generate iframe content
  const transpileAndBuildReact = useCallback(async (sourceCode: string, fw: FrameworkType) => {
    try {
      setError(null);
      setIsLoading(true);

      const trimmedCode = sourceCode.trim();

      // Skip if code is empty or just a placeholder comment
      if (!trimmedCode || trimmedCode.startsWith('// No node selected')) {
        setIsLoading(false);
        return '';
      }

      // Detect if HTML code is being sent to React transpiler (framework mismatch)
      // React code MUST contain 'export function' or 'function' keyword
      // HTML code uses <!-- --> comments or class= attributes (not className)
      const isReactCode = trimmedCode.includes('export function') ||
                         trimmedCode.includes('function ') ||
                         trimmedCode.includes('const ') && trimmedCode.includes('=>');
      const isHtmlCode = trimmedCode.includes('<!--') ||
                        trimmedCode.includes('class=') || // HTML uses class=, React uses className=
                        (trimmedCode.startsWith('<') && !isReactCode);

      if (isHtmlCode) {
        // Code is HTML but framework is React - skip rendering to avoid crash
        // The useEffect will re-run once the correct React code is generated
        setIsLoading(false);
        return '';
      }

      // Fetch React libraries content (will be inlined in srcDoc to avoid CORS)
      const [reactResponse, reactDomResponse, transpileResponse] = await Promise.all([
        fetch('/preview-libs/react.js'),
        fetch('/preview-libs/react-dom.js'),
        fetch('/api/transpile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: sourceCode, framework: fw }),
        }),
      ]);

      if (!transpileResponse.ok) {
        const errorData = await transpileResponse.json();
        throw new Error(errorData.message || 'Transpilation failed');
      }

      const reactCode = await reactResponse.text();
      const reactDomCode = await reactDomResponse.text();
      const { transpiledCode, componentName } = await transpileResponse.json();

      // Generate Tailwind CSS dynamically for react-tailwind (includes JIT for arbitrary values)
      let tailwindCSS = '';
      if (fw === 'react-tailwind') {
        const tailwindResponse = await fetch('/api/generate-tailwind-css', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: sourceCode }),
        });

        if (tailwindResponse.ok) {
          const { css } = await tailwindResponse.json();
          tailwindCSS = css;
        } else {
          console.warn('Failed to generate Tailwind CSS, using fallback');
        }
      }

      // Build iframe document with inlined libraries (no external script tags = no CORS)
      return buildReactDocument(transpiledCode, componentName, reactCode, reactDomCode, tailwindCSS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transpilation failed');
      return '';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate iframe content (HTML/CSS synchronously, React asynchronously)
  useEffect(() => {
    const generateContent = async () => {
      try {
        setError(null);
        setIsLoading(true);

        let content = '';

        switch (strategy) {
          case 'html':
            content = buildHTMLDocument(code);
            break;
          case 'react':
            content = await transpileAndBuildReact(code, framework);
            break;
          case 'none':
          default:
            content = '';
        }

        setIframeContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rendering failed');
        setIframeContent('');
      } finally {
        setIsLoading(false);
      }
    };

    generateContent();
  }, [code, strategy, framework, transpileAndBuildReact]);

  // Listen for iframe runtime errors
  useEffect(() => {
    const handleIframeError = (event: MessageEvent) => {
      if (event.data?.type === 'error') {
        setError(event.data.message);
      }
    };

    window.addEventListener('message', handleIframeError);
    return () => window.removeEventListener('message', handleIframeError);
  }, []);

  // No live preview for frameworks that don't support it
  if (strategy === 'none') {
    return (
      <div className="h-full w-full bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          Live preview not available for {framework}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10">
        <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
          Preview Rendering Error
        </div>
        <pre className="text-sm text-red-500 dark:text-red-300 bg-red-100 dark:bg-red-900/20 p-4 rounded max-w-2xl overflow-auto">
          {error}
        </pre>
        <button
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Rendering preview...</span>
      </div>
    );
  }

  // Show iframe with live preview
  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 flex items-center justify-center">
      {iframeContent ? (
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          title="Live Preview"
          referrerPolicy="no-referrer"
          allow=""
        />
      ) : (
        <div className="text-gray-500 dark:text-gray-400">
          No preview available
        </div>
      )}
    </div>
  );
}
