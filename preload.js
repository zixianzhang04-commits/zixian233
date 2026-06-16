const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // 记录
  records: {
    create: (data) => ipcRenderer.invoke('records:create', data),
    update: (id, data) => ipcRenderer.invoke('records:update', id, data),
    delete: (id) => ipcRenderer.invoke('records:delete', id),
    get: (id) => ipcRenderer.invoke('records:get', id),
    list: (filters) => ipcRenderer.invoke('records:list', filters),
    copyLast: () => ipcRenderer.invoke('records:copy-last'),
  },

  // 分类
  categories: {
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    checkDelete: (id) => ipcRenderer.invoke('categories:check-delete', id),
    forceDelete: (id) => ipcRenderer.invoke('categories:force-delete', id),
    get: (id) => ipcRenderer.invoke('categories:get', id),
    list: (type) => ipcRenderer.invoke('categories:list', type),
    tree: (type) => ipcRenderer.invoke('categories:tree', type),
    updateOrder: (id, sortOrder) => ipcRenderer.invoke('categories:update-order', id, sortOrder),
  },

  // 预算
  budgets: {
    get: (periodType) => ipcRenderer.invoke('budgets:get', periodType),
    set: (data) => ipcRenderer.invoke('budgets:set', data),
  },
});
