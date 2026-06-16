import React from 'react';

const tabs = [
  { key: 'records',    label: '记账', icon: '📝' },
  { key: 'categories', label: '分类', icon: '📂' },
  { key: 'stats',      label: '统计', icon: '📊' },
  { key: 'budgets',    label: '预算', icon: '💰' },
];

export default function BottomTabBar({ activeNav, onNavChange }) {
  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-item ${activeNav === tab.key ? 'active' : ''}`}
          onClick={() => onNavChange(tab.key)}
          aria-label={tab.label}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
