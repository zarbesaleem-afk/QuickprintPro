
import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, trend, colorClass = "bg-white dark:bg-gray-900" }) => {
  return (
    <div className={`${colorClass} p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>{trend.isPositive ? '↑' : '↓'} {trend.value}%</span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">vs last week</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
