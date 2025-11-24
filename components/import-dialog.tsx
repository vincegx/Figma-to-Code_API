'use client';

import { useState } from 'react';
import { useNodesStore, useUIStore } from '@/lib/store';
import { parseFigmaUrl } from '@/lib/utils/url-parser';

export default function ImportDialog() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const importNode = useNodesStore((state) => state.importNode);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const setImporting = useUIStore((state) => state.setImporting);
  const isImporting = useUIStore((state) => state.isImporting);
  const invalidateStats = useUIStore((state) => state.invalidateStats);

  const handleImport = async () => {
    setError('');

    // Validate URL
    try {
      parseFigmaUrl(url); // Throws if invalid
    } catch (err: any) {
      setError(err.message || 'Invalid Figma URL');
      return;
    }

    setImporting(true);

    try {
      // Call import API route (WP03)
      const response = await fetch('/api/figma/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const apiResponse = await response.json();

      // API returns {success, nodeId, metadata} - extract just the metadata
      const nodeMetadata = apiResponse.metadata;

      // Update nodes-store with the LibraryNode
      importNode(nodeMetadata);

      // Reload library to get updated data
      await loadLibrary();

      // Invalidate stats cache (force recalculation)
      invalidateStats();

      // Clear input
      setUrl('');

      // TODO: Show success toast (will be implemented with toast library)
      console.log('Node imported successfully:', nodeMetadata.name);
    } catch (err: any) {
      setError(err.message || 'Failed to import node');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Import Figma Node</h3>

      <div className="flex gap-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/file/..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          disabled={isImporting}
        />
        <button
          onClick={handleImport}
          disabled={isImporting || !url}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Paste a Figma URL with a node-id parameter to import a node into your library.
      </p>
    </div>
  );
}
