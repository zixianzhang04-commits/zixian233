import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserDb, getApi } from './browser-db';

const DbContext = createContext(null);

export function DbProvider({ children }) {
  const [api, setApi] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const minTime = new Promise(r => setTimeout(r, 3000));
    async function init() {
      try {
        console.log('[DbProvider] 开始初始化...');
        if (window.electronAPI) {
          console.log('[DbProvider] 检测到 Electron 环境');
          setApi(window.electronAPI);
        } else {
          console.log('[DbProvider] 浏览器环境，加载 sql.js...');
          await createBrowserDb();
          console.log('[DbProvider] sql.js 加载成功');
          setApi(getApi());
          console.log('[DbProvider] API 就绪');
        }
      } catch (err) {
        console.error('[DbProvider] 初始化失败:', err);
        setError(err.message || String(err));
      } finally {
        await minTime;
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"><img src="./icons/logo-8.png" alt="" style={{width:80,height:80}} /></div>
        <p>小盷记账</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3>初始化失败</h3>
        <p style={{ color: '#e65a5a', maxWidth: 400, textAlign: 'center', marginTop: 8 }}>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    );
  }

  return <DbContext.Provider value={api}>{children}</DbContext.Provider>;
}

export function useDb() {
  const api = useContext(DbContext);
  if (!api) {
    throw new Error('useDb 必须在 DbProvider 内使用');
  }
  return api;
}
