'use client';

import { useMemo } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, MultiFrameworkRuleMatch, FrameworkType } from '@/lib/types/rules';
import { getMultiFrameworkRuleMatches } from '@/lib/rule-engine';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AppliedRulesInspectorProps {
  altNode: SimpleAltNode | null;
  selectedNodeId: string | null;
  multiFrameworkRules: MultiFrameworkRule[];
  selectedFramework: FrameworkType;
}

export default function AppliedRulesInspector({
  altNode,
  selectedNodeId,
  multiFrameworkRules,
  selectedFramework,
}: AppliedRulesInspectorProps) {
  // Find the selected node in the tree
  const selectedNode = useMemo(() => {
    if (!altNode || !selectedNodeId) return null;
    return findNodeById(altNode, selectedNodeId);
  }, [altNode, selectedNodeId]);

  // Evaluate multi-framework rules for selected node
  const ruleMatches = useMemo(() => {
    if (!selectedNode || !multiFrameworkRules || multiFrameworkRules.length === 0) return [];
    return getMultiFrameworkRuleMatches(selectedNode, multiFrameworkRules, selectedFramework);
  }, [selectedNode, multiFrameworkRules, selectedFramework]);

  // Calculate coverage stats
  const coverageStats = useMemo(() => {
    if (!selectedNode || ruleMatches.length === 0) {
      return { matchedProperties: 0, totalProperties: 0, percentage: 0 };
    }

    // Count unique properties across all matches
    const allProperties = new Set<string>();
    ruleMatches.forEach((match) => {
      match.contributedProperties.forEach((prop) => allProperties.add(prop));
    });

    // For demo purposes, consider a typical set of CSS properties
    const typicalProperties = [
      'width',
      'height',
      'backgroundColor',
      'color',
      'fontSize',
      'fontWeight',
      'padding',
      'margin',
      'borderRadius',
      'display',
      'flexDirection',
      'alignItems',
      'justifyContent',
    ];

    const matchedProperties = allProperties.size;
    const totalProperties = typicalProperties.length;
    const percentage = Math.round((matchedProperties / totalProperties) * 100);

    return { matchedProperties, totalProperties, percentage };
  }, [selectedNode, ruleMatches]);

  if (!altNode) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400">
        <p>Loading node data...</p>
      </div>
    );
  }

  if (!selectedNodeId) {
    return (
      <div className="p-8 text-center">
        <Info size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          No Node Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click on a node in the tree view to inspect applied rules
        </p>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400">
        <p>Selected node not found in tree</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Applied Rules
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedNode.name} ({selectedNode.type})
            </p>
          </div>

          {/* Coverage Badge */}
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                coverageStats.percentage >= 80
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : coverageStats.percentage >= 50
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              <CheckCircle size={14} />
              {coverageStats.percentage}% Coverage
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {coverageStats.matchedProperties} / {coverageStats.totalProperties}{' '}
              properties
            </p>
          </div>
        </div>
      </div>

      {/* Rule Matches */}
      {ruleMatches.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">
            No Rules Match
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No rules matched this node. Try creating rules to cover this pattern.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ruleMatches.map((match, index) => (
            <RuleMatchCard key={index} match={match} rank={index + 1} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Priority Legend
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">1000+ Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">100-999 High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">10-99 Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">1-9 Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for individual rule match
function RuleMatchCard({ match, rank }: { match: MultiFrameworkRuleMatch; rank: number }) {
  const priorityColor =
    match.priority >= 1000
      ? 'bg-red-500'
      : match.priority >= 100
      ? 'bg-orange-500'
      : match.priority >= 10
      ? 'bg-yellow-500'
      : 'bg-blue-500';

  const propertyCount = match.contributedProperties.length;
  const hasConflicts = match.conflicts.length > 0;
  const severityColor =
    match.severity === 'major'
      ? 'text-red-600 dark:text-red-400'
      : match.severity === 'minor'
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-green-600 dark:text-green-400';

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Rule Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 ${priorityColor} rounded flex items-center justify-center text-white text-sm font-bold`}
          >
            #{rank}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {match.ruleName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Priority: {match.priority}
            </p>
          </div>
        </div>
        {hasConflicts && (
          <span className={`text-xs font-medium ${severityColor}`}>
            {match.conflicts.length} conflict{match.conflicts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Properties */}
      <div className="mt-3">
        <h5 className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
          Contributed Properties ({propertyCount})
        </h5>
        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 space-y-1 max-h-40 overflow-y-auto">
          {match.contributedProperties.map((prop) => (
            <div
              key={prop}
              className="text-xs font-mono text-gray-700 dark:text-gray-300"
            >
              • {prop}
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {hasConflicts && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
            Conflicts
          </h5>
          <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 space-y-1">
            {match.conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="text-xs font-mono text-red-700 dark:text-red-300"
              >
                ⚠ {conflict}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to find node by ID in tree
function findNodeById(node: SimpleAltNode, id: string): SimpleAltNode | null {
  if (node.id === id) return node;

  if ('children' in node && node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }

  return null;
}
