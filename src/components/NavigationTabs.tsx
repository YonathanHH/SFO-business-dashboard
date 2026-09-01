import React from 'react';
import { LayoutDashboard, Swords, Building2, Globe2, Plane, Table, Sparkles } from 'lucide-react';

export type TabId = 'overview' | 'duopoly' | 'airlines' | 'routes' | 'fleet' | 'explorer' | 'insights';

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview' as TabId, label: 'Mission Control', icon: LayoutDashboard, badge: 'KPIs & Trends' },
    { id: 'duopoly' as TabId, label: 'Boeing vs Airbus', icon: Swords, badge: 'Duopoly War' },
    { id: 'airlines' as TabId, label: 'Carrier Intelligence', icon: Building2, badge: 'Airlines' },
    { id: 'routes' as TabId, label: 'Geographic Routes', icon: Globe2, badge: 'Global Focus' },
    { id: 'fleet' as TabId, label: 'Fleet & Gauge', icon: Plane, badge: 'Body & MTOW' },
    { id: 'explorer' as TabId, label: 'Data Explorer', icon: Table, badge: 'Raw Pivot' },
    { id: 'insights' as TabId, label: 'Executive Insights', icon: Sparkles, badge: 'AI & Seasonal' },
  ];

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-2 min-w-max p-1 bg-aviation-card/60 backdrop-blur border border-aviation-border rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-medium text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-aviation-cardHover'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
