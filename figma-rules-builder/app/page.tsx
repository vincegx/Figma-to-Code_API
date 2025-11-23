'use client';

import { useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FigmaTreeView } from '@/components/figma-tree-view';
import type { AltNode } from '@/lib/types/altnode';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [altNodeTree, setAltNodeTree] = useState<AltNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!figmaUrl || !nodeId) {
      setError('Please provide both Figma URL and Node ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/figma/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ figmaUrl, nodeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Figma data');
      }

      const data = await response.json();
      setAltNodeTree(data.altNode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Figma Rules Builder</h1>
          <div className="flex flex-1 items-center gap-2">
            <Input
              type="text"
              placeholder="Figma URL (e.g., https://figma.com/file/...)"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className="flex-1 max-w-md"
              disabled={loading}
            />
            <Input
              type="text"
              placeholder="Node ID (e.g., 1:2)"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-32"
              disabled={loading}
            />
            <Button onClick={handleFetch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Fetch'
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </header>

      {/* Three-Panel Layout */}
      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100vh-80px)]"
      >
        {/* Left Panel: Figma Tree View */}
        <ResizablePanel defaultSize={25} minSize={15}>
          <div className="h-full overflow-auto border-r border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              FIGMA TREE
            </h2>
            {altNodeTree ? (
              <FigmaTreeView node={altNodeTree} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No tree loaded. Enter Figma URL and Node ID, then click Fetch.
              </p>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Panel: Rule Editor */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-auto bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              RULE EDITOR
            </h2>
            <p className="text-sm text-muted-foreground">
              Monaco Editor will be integrated here (WP08)
            </p>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Code Previews */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full overflow-auto border-l border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
              CODE PREVIEW
            </h2>
            <p className="text-sm text-muted-foreground">
              Preview tabs will be integrated here (WP09)
            </p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
