import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const pageTitles = {
  records: '记账管理',
  categories: '分类管理',
  stats: '数据统计',
  budgets: '预算管理',
};

export default function Layout({ activeNav, onNavChange, children }) {
  return (
    <div className="layout">
      <Sidebar activeNav={activeNav} onNavChange={onNavChange} />
      <div className="layout-main">
        <TopBar title={pageTitles[activeNav] || ''}>
          {null}
        </TopBar>
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export { pageTitles };
