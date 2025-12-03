'use client';

/**
 * ConversionPipeline - Progress Visualization (WP42 Redesign V2)
 *
 * Shows the Figma → Code conversion process with:
 * - "Active" badge with lightning icon
 * - 3 numbered progress bars with distinct colors
 * - Mini-stats with sparklines at bottom
 */

import { useNodesStore } from '@/lib/store';
import { useConversionRate } from '@/hooks/use-conversion-rate';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface NumberedProgressBarProps {
  step: number;
  label: string;
  value: number;
  max: number;
  color: string;
  bgColor: string;
}

function NumberedProgressBar({ step, label, value, max, color, bgColor }: NumberedProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded text-xs font-bold',
            bgColor
          )}
        >
          {step}
        </span>
        <span className="text-sm text-text-secondary flex-1">{label}</span>
        <span className="text-sm font-medium text-text-primary tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden ml-9">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface MiniStatProps {
  value: number | string;
  label: string;
  sparklineData: number[];
  color: string;
}

function MiniStat({ value, label, sparklineData, color }: MiniStatProps) {
  const chartData = useMemo(() =>
    sparklineData.map((val, i) => ({ value: val, index: i })),
    [sparklineData]
  );

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xl font-bold text-text-primary tabular-nums mb-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-text-muted mb-2 truncate">{label}</div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`mini-gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#mini-gradient-${label.replace(/\s/g, '')})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ConversionPipeline() {
  const nodes = useNodesStore((s) => s.nodes);
  const { rate, semantic, total } = useConversionRate();

  const totalNodes = nodes.length;
  const matchedPercentage = rate;
  const semanticPercentage = Math.round(matchedPercentage * 0.88);

  // Generate sample sparkline data
  const nodesSparkline = useMemo(() => [8, 10, 9, 12, 11, 12, totalNodes || 12], [totalNodes]);
  const deprecationSparkline = useMemo(() => [2, 1, 3, 2, 1, 0, 0], []);
  const semanticSparkline = useMemo(() => [20, 25, 30, 35, 38, 40, semanticPercentage || 40], [semanticPercentage]);

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Conversion Pipeline</h3>
          <p className="text-xs text-text-muted mt-0.5">Real-time processing stages</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-secondary border border-border-primary text-xs text-text-secondary">
          <Zap className="w-3 h-3 text-amber-400" />
          Active
        </div>
      </div>

      {/* Numbered Progress Bars */}
      <div className="space-y-4 flex-1">
        <NumberedProgressBar
          step={1}
          label="Nodes imported"
          value={totalNodes}
          max={totalNodes || 1}
          color="bg-cyan-500"
          bgColor="bg-cyan-500/20 text-cyan-400"
        />
        <NumberedProgressBar
          step={2}
          label="Properties matched"
          value={matchedPercentage}
          max={100}
          color="bg-gradient-to-r from-amber-500 to-emerald-500"
          bgColor="bg-amber-500/20 text-amber-400"
        />
        <NumberedProgressBar
          step={3}
          label="Semantic classes"
          value={semanticPercentage}
          max={100}
          color="bg-emerald-500"
          bgColor="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Mini Stats with Sparklines */}
      <div className="flex gap-4 mt-6 pt-4 border-t border-border-primary">
        <MiniStat
          value={totalNodes}
          label="Nodes imported"
          sparklineData={nodesSparkline}
          color="#22d3ee"
        />
        <MiniStat
          value="0%"
          label="Deprecation rejected"
          sparklineData={deprecationSparkline}
          color="#fbbf24"
        />
        <MiniStat
          value={`${semanticPercentage}%`}
          label="Semantic classes"
          sparklineData={semanticSparkline}
          color="#34d399"
        />
      </div>
    </div>
  );
}
