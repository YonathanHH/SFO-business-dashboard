import React from 'react';
import { formatNumber, formatWeight, formatPercent } from '../utils/formatters';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  weightUnit?: 'lbs' | 'metric_tonnes';
  type?: 'general' | 'share' | 'weight' | 'count';
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  weightUnit = 'lbs',
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-[#0B111E]/95 backdrop-blur-md border border-aviation-borderLight rounded-xl p-3.5 shadow-2xl text-xs font-mono min-w-[200px]">
      <div className="border-b border-aviation-border pb-1.5 mb-2 font-bold text-sky-400">
        {label}
      </div>
      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          let formattedValue = item.value;
          const name = item.name || '';
          const nameLower = name.toLowerCase();

          if (nameLower.includes('weight') || nameLower.includes('mtow')) {
            formattedValue = formatWeight(Number(item.value), weightUnit);
          } else if (nameLower.includes('share') || nameLower.includes('ratio') || nameLower.includes('%')) {
            formattedValue = formatPercent(Number(item.value));
          } else if (typeof item.value === 'number') {
            formattedValue = formatNumber(item.value);
          }

          return (
            <div key={`tooltip-item-${idx}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color || item.fill || '#38BDF8' }}
                />
                <span className="text-slate-300 font-medium">{item.name}:</span>
              </div>
              <span className="font-bold text-white">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
