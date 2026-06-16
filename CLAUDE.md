# CLAUDE 工作指引

此项目为跨平台个人记账软件。桌面端 Electron + React，移动端 PWA。

## 目录结构说明

- `docs/`
  - `requirements.md`：项目需求与功能标准。
  - `tech-spec.md`：技术方案、架构与数据结构。
  - `design-guidelines.md`：UI 设计规范和交互标准。
  - `execution-plan.md`：开发阶段、迭代计划与执行步骤。
- `dev-logs/`
  - `README.md`：开发日志使用说明。
  - `YYYY-MM-DD.md`：每日开发完成事项与待办事项。
- `scripts/daily-log.js`：生成当天开发日志模板的脚本。
- `src/`：React 前端源码
  - `api/`：数据库层（browser-db.js / db-context.jsx / backup.js）
  - `components/`：通用组件（Layout / Sidebar / TopBar / RecordForm / RecordList / ImportExport）
  - `pages/`：页面（RecordsPage / CategoriesPage / StatsPage / BudgetsPage）
  - `database/`：Electron 主进程数据库（init.cjs / queries.cjs）

## 工作说明

1. 先按照 `docs/execution-plan.md` 中的阶段计划推进开发。
2. 每日开发开始前或结束时运行 `node scripts/daily-log.js`，生成当天日志文件。
3. 按照 `docs/requirements.md` 和 `docs/design-guidelines.md` 逐项校对功能实现。
4. 每次完成一个小模块或验收点后，更新对应日志文件中的“完成事项”和“待办事项”。

## 版本与稳定性原则

- 小步快跑，分阶段验证
- 移动端改动渐进式，不影响桌面版
- 每阶段完成后自测，确保数据安全
- 每次提交保持可回滚状态
- 数据存储层（sql.js + localStorage）不变，只改 UI 表现层
- 需求变更先在 `docs/requirements.md` 记录并确认

## 关键文件路径

| 用途 | 路径 |
|------|------|
| 桌面入口 | `main.cjs` |
| PWA 配置 | `public/manifest.json` + `public/sw.js` |
| 前端入口 | `index.html` → `src/main.jsx` |
| 全局样式 | `src/styles.css` |
| Vite 配置 | `vite.config.mjs` |
| 浏览器数据库 | `src/api/browser-db.js` |
| 桌面数据库 | `src/database/init.cjs` + `queries.cjs` |
| IPC 桥接 | `preload.cjs` |
