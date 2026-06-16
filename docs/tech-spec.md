# 技术规范与架构

## 1. 技术栈
| 层 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 构建工具 | Vite 6 (ESM mode) |
| 数据库（浏览器） | sql.js (WebAssembly) + localStorage |
| 数据库（Electron） | better-sqlite3 |
| 图表 | Recharts |
| Excel/CSV | xlsx (SheetJS) |
| 字体 | Inter (Google Fonts) |
| 部署 | Cloudflare Pages |

## 2. 架构层次
```
渲染进程（React）
  └── DbProvider (API Context)
       ├── Electron: IPC → main.js → better-sqlite3
       └── Browser: sql.js + localStorage

主进程（Electron，桌面版）
  ├── main.cjs — 窗口管理 + IPC handlers
  ├── preload.cjs — contextBridge 暴露 API
  └── src/database/init.cjs + queries.cjs — SQLite 操作
```

## 3. 数据模型

### 分类表 categories
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| name | TEXT | 分类名 |
| type | TEXT | income / expense |
| icon | TEXT | Emoji 图标 |
| parentId | TEXT | 父分类 ID（子分类） |
| sortOrder | INTEGER | 排序 |

### 记录表 records
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| amount | REAL | 金额 |
| type | TEXT | income / expense |
| categoryId | TEXT FK | 分类 |
| subcategoryId | TEXT FK | 子分类 |
| date | TEXT | 日期 (YYYY-MM-DD) |
| note | TEXT | 备注 |
| createdAt/updatedAt | TEXT | 时间戳 |

### 预算表 budgets
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| periodType | TEXT | month |
| amount | REAL | 预算额 |
| startDate/endDate | TEXT | 周期 |

## 4. PWA 配置
- `public/manifest.json` — App 名称/图标/全屏
- `public/sw.js` — Service Worker（离线缓存）
- `public/icon-192.png` + `icon-512.png`
- `index.html` — Apple meta 标签 + manifest 链接

## 5. 项目配置
- `package.json` — `"type": "module"`（ESM 默认）
- `vite.config.mjs` — Vite 配置（ESM）
- `wrangler.toml` — Cloudflare 配置（已删除，使用 Web UI）
- `.github/workflows/deploy.yml` — GitHub Actions
