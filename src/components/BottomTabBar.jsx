import React from 'react';
import PixelIcon from './PixelIcon';

const tabs = [
  { key: 'records', label: '账单', icon: 'nav-records' },
  { key: 'stats',   label: '统计', icon: 'nav-stats' },
  { key: 'budgets', label: '预算', icon: 'nav-budgets' },
  { key: 'profile', label: '我的', icon: 'nav-profile' },
];

export default function BottomTabBar({ activeNav, onNavChange }) {
  return (
    <nav className="bottom-tab-bar">
      {tabs.slice(0, 2).map((tab) => (
        <button key={tab.key} className={`tab-item ${activeNav===tab.key?'active':''}`}
          onClick={()=>onNavChange(tab.key)} aria-label={tab.label}>
          <span className="tab-icon"><PixelIcon name={tab.icon} size={24}/></span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
      <button className="tab-item tab-center" onClick={()=>onNavChange('add')} aria-label="添一笔">
        <span className="tab-center-btn">＋</span>
      </button>
      {tabs.slice(2).map((tab) => (
        <button key={tab.key} className={`tab-item ${activeNav===tab.key?'active':''}`}
          onClick={()=>onNavChange(tab.key)} aria-label={tab.label}>
          <span className="tab-icon"><PixelIcon name={tab.icon} size={24}/></span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
