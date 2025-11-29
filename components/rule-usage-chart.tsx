'use client';

import { useRulesStore } from '@/lib/store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RuleUsageChart() {
  const rules = useRulesStore((state) => state.rules);
  const ruleMatches = useRulesStore((state) => state.ruleMatches);

  // Build chart data: top 5 rules by match count
  const chartData = rules
    .map((rule) => ({
      name: rule.metadata.name.length > 15 ? rule.metadata.name.slice(0, 15) + '...' : rule.metadata.name,
      matches: ruleMatches.get(rule.metadata.id) || 0,
    }))
    .sort((a, b) => b.matches - a.matches)
    .slice(0, 5);

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card rounded-lg border border-border-primary shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Rule Usage</h3>
        <p className="text-text-muted">No rules created yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-lg border border-border-primary shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Top 5 Rules by Match Count</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="matches" fill="var(--accent-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
