'use client';

import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

interface CodePreviewProps {
  code: string;
  language: 'tsx' | 'html' | 'jsx' | 'typescript' | 'css';
}

export default function CodePreview({ code, language }: CodePreviewProps) {
  const codeRef = useRef<HTMLElement>(null);

  // Apply syntax highlighting when code or language changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
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
