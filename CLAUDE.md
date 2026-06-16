# CLAUDE 工作指引

此项目为跨平台 Electron 桌面记账软件。

## 目录结构说明

- `docs/`
  - `requirements.md`：记录项目需求与功能标准。
  - `tech-spec.md`：记录技术方案、架构与数据结构。
  - `design-guidelines.md`：记录 UI 设计规范和交互标准。
  - `execution-plan.md`：记录开发阶段、迭代计划与执行步骤。

- `dev-logs/`
  - `README.md`：开发日志使用说明。
  - `YYYY-MM-DD.md`：每日开发完成事项与待办事项日志文件。

- `scripts/daily-log.js`：生成当天开发日志模板的脚本，可用 Windows 任务计划程序调度执行。

## 工作说明

1. 先按照 `docs/execution-plan.md` 中的阶段计划推进开发。
2. 每日开发开始前或结束时运行 `node scripts/daily-log.js`，生成当天日志文件：
   - `dev-logs/YYYY-MM-DD.md`
3. 按照 `docs/requirements.md` 和 `docs/design-guidelines.md` 逐项校对功能实现。
4. 每次完成一个小模块或验收点后，更新对应日志文件中的“完成事项”和“待办事项”。

## 版本与稳定性原则

- 项目按阶段划分，不要一次做太多；优先完成基础功能再扩展。
- 每个阶段完成后进行自测，确保数据安全、功能稳定。
- 开发过程中，如有需求变更，先在 `docs/requirements.md` 记录并确认。

---

> 这个 `CLAUDE.md` 为项目协作指引文件，后续团队成员可以直接查看各项标准文件路径与执行说明。