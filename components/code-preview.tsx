'use client';

import { useEffect, useRef } from 'react';
// Import CSS statically (no SSR issues with CSS)
import 'prismjs/themes/prism-tomorrow.css';

interface CodePreviewProps {
  code: string;
  language: 'tsx' | 'html' | 'jsx' | 'typescript' | 'css';
}

export default function CodePreview({ code, language }: CodePreviewProps) {
  const codeRef = useRef<HTMLElement>(null);

  // Apply syntax highlighting when code or language changes
  // Dynamically load Prism.js only on client-side to avoid SSR issues
  useEffect(() => {
    const loadPrism = async () => {
      // Dynamic imports to prevent SSR execution
      const Prism = (await import('prismjs')).default;
      // @ts-ignore - Dynamic import for Prism components
      await import('prismjs/components/prism-typescript');
      // @ts-ignore
      await import('prismjs/components/prism-tsx');
      // @ts-ignore
      await import('prismjs/components/prism-jsx');
      // @ts-ignore
      await import('prismjs/components/prism-markup');
      // @ts-ignore
      await import('prismjs/components/prism-css');

      if (codeRef.current) {
        Prism.highlightElement(codeRef.current);
      }
    };
    loadPrism();
  }, [code, language]);

  // Map language to Prism language class
  const prismLanguage = language === 'tsx' || language === 'jsx' ? 'tsx' : language;

  return (
    <div className="h-full bg-gray-900">
      <pre className="h-full m-0 overflow-auto">
        <code ref={codeRef} className={`language-${prismLanguage}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
