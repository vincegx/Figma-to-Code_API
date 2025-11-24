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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>

      {trend && (
        <div className="mt-2 text-sm">
          <span
            className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}
          </span>
          <span className="text-gray-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
