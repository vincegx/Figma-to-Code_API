'use client';

/**
 * VersionDropdown Component
 *
 * WP40 T350: Dropdown for selecting historical versions of a Figma node.
 * Shows current version with badge, and historical versions in a dropdown.
 */

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VersionEntry, VersionsResponse } from '@/lib/types/versioning';

interface VersionDropdownProps {
  nodeId: string;
  /** Currently selected version folder (null = current version) */
  selectedVersion: string | null;
  /** Callback when version is selected */
  onVersionSelect: (folder: string | null) => void;
  /** Key to force refresh of version list (e.g., after refetch) */
  refreshKey?: number;
  className?: string;
}

export function VersionDropdown({
  nodeId,
  selectedVersion,
  onVersionSelect,
  refreshKey,
  className,
}: VersionDropdownProps) {
  const [versions, setVersions] = useState<VersionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch versions on mount, when nodeId changes, or when refreshKey changes
  useEffect(() => {
    async function fetchVersions() {
      if (!nodeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/figma/node/${encodeURIComponent(nodeId)}/versions`);

        if (!response.ok) {
          if (response.status === 404) {
            // No version history yet - that's OK
            setVersions(null);
            return;
          }
          throw new Error('Failed to fetch versions');
        }

        const data = await response.json() as VersionsResponse;
        setVersions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load versions');
        setVersions(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersions();
  }, [nodeId, refreshKey]);

  // Format date for display
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Get display text for trigger
  const getDisplayText = () => {
    if (isLoading) return 'Chargement...';
    if (!versions) return 'Aucune version';

    if (selectedVersion === null) {
      // Current version
      return formatDate(versions.current.figmaLastModified);
    }

    // Find selected historical version
    const selected = versions.history.find(v => v.folder === selectedVersion);
    if (selected) {
      return formatDate(selected.figmaLastModified);
    }

    return 'Version inconnue';
  };

  const hasHistory = versions && versions.history.length > 0;
  const isViewingHistory = selectedVersion !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading || error !== null}
          className={cn(
            'h-auto py-1 px-2 text-xs font-normal',
            isViewingHistory && 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
            className
          )}
        >
          <Clock className="w-3 h-3 mr-1" />
          {getDisplayText()}
          {hasHistory && <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
      </DropdownMenuTrigger>

      {hasHistory && (
        <DropdownMenuContent align="start" className="w-56 z-[100] bg-white dark:bg-gray-900 shadow-lg border">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <History className="w-3 h-3" />
            Historique des versions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Current version */}
          <DropdownMenuItem
            onClick={() => onVersionSelect(null)}
            className={cn(
              'cursor-pointer',
              selectedVersion === null && 'bg-blue-50 dark:bg-blue-900'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span>{formatDate(versions!.current.figmaLastModified)}</span>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                actuel
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Historical versions */}
          {versions!.history.map((version) => (
            <DropdownMenuItem
              key={version.folder}
              onClick={() => onVersionSelect(version.folder)}
              className={cn(
                'cursor-pointer',
                selectedVersion === version.folder && 'bg-amber-50 dark:bg-amber-900'
              )}
            >
              <div className="flex items-center justify-between w-full text-sm">
                <span>{formatDate(version.figmaLastModified)}</span>
                {selectedVersion === version.folder && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    consulté
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

export default VersionDropdown;
