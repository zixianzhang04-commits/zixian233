import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';

const pageTitles = {
  records: '账单',
  add: '添一笔',
  profile: '我的',
  categories: '分类管理',
  stats: '数据统计',
  budgets: '预算管理',
};

export default function Layout({ activeNav, onNavChange, children }) {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const a=()=>setOffline(false),b=()=>setOffline(true);
    window.addEventListener('online',a); window.addEventListener('offline',b);
    // Listen for SW update
    if (window.__swUpdateReady) setUpdateReady(true);
    window.__onSwUpdate = () => setUpdateReady(true);
    return ()=>{window.removeEventListener('online',a);window.removeEventListener('offline',b);};
  }, []);

  return (
    <div className="layout">
      {offline && <div className="offline-banner">⚠️ 当前离线，数据保存在本地</div>}
      {updateReady && <div className="update-banner" onClick={()=>{if(navigator.serviceWorker){navigator.serviceWorker.getRegistration().then(r=>r&&r.waiting&&r.waiting.postMessage('SKIP_WAITING'));}window.location.reload();}}>🔄 新版本可用，点击更新</div>}
      <Sidebar activeNav={activeNav} onNavChange={onNavChange} />
      <div className="layout-main">
        <TopBar title={pageTitles[activeNav] || ''}>
          {null}
        </TopBar>
        <main className="layout-content">
          {children}
        </main>
        <BottomTabBar activeNav={activeNav} onNavChange={onNavChange} />
      </div>
    </div>
  );
}

export { pageTitles };
