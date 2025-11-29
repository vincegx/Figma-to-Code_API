interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number; // +5 or -3
    label: string; // "vs last week"
  };
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-bg-card rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">
          {title}
        </h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <div className="text-3xl font-bold text-text-primary">
        {value}
      </div>

      {trend && (
        <div className="mt-2 text-sm">
          <span
            className={trend.value >= 0 ? 'text-status-success-text' : 'text-status-error-text'}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
          </span>
          <span className="text-text-muted ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
