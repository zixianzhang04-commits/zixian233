import React from 'react';

const navItems = [
  { key: 'records', label: '记账', icon: '📝' },
  { key: 'categories', label: '分类', icon: '📂' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'budgets', label: '预算', icon: '💰' },
];

export default function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">📒</span>
        <span className="sidebar-title">简单记账</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${activeNav === item.key ? 'active' : ''}`}
            onClick={() => onNavChange(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-version">v0.1.0</span>
      </div>
    </aside>
  );
}
