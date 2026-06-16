# 技术规范与架构

## 1. 技术栈
- Electron：桌面容器与本地系统访问
- React 或 Vue：前端 UI 框架
- SQLite：本地数据存储
- better-sqlite3 / TypeORM：数据库操作
- xlsx：Excel `xlsx` 格式读写
- csv-parser / fast-csv：CSV 读写
- ECharts / Recharts / Chart.js：图表展示
- bcryptjs / argon2：密码哈希加密

## 2. 架构层次
- 主进程：Electron 应用生命周期、窗口管理、文件系统与数据库访问
- 渲染进程：前端页面、UI 交互、数据展示
- 预加载脚本：安全地暴露受限 API 给渲染进程
- 本地存储：SQLite 数据库文件存储于 `userData` 目录

## 3. 数据模型

### 用户表
- `id`
- `username`
- `passwordHash`
- `createdAt`
- `lastLoginAt`

### 分类表
- `id`
- `userId`
- `name`
- `type`（收入/支出）
- `icon`
- `color`
- `parentId`
- `order`

### 记录表
- `id`
- `userId`
- `amount`
- `type`
- `categoryId`
- `subcategoryId`
- `date`
- `note`
- `createdAt`
- `updatedAt`

### 预算表
- `id`
- `userId`
- `categoryId`（可为空）
- `periodType`（month/quarter/year）
- `amount`
- `startDate`
- `endDate`
- `createdAt`
- `updatedAt`

### 操作历史表
- `id`
- `userId`
- `actionType`
- `targetTable`
- `targetId`
- `oldValue`
- `newValue`
- `createdAt`

## 4. 安全与备份
- 密码存储采用哈希加盐，禁止明文保存
- 数据库文件存放于系统用户目录下
- 自动备份周期可配置，备份文件生成于 `userData/backups`
- 恢复前备份当前数据，防止误操作导致数据丢失

## 5. 数据导入导出规范
- 导出要包含字段头：金额、类型、分类、子分类、日期、备注
- 导入需支持字段名称映射与默认值填充
- 导入异常数据要给出行号与具体错误信息
- 导入过程应支持预览与确认

## 6. 交互与状态管理
- 所有重要状态变更通过中心化状态管理处理
- 使用事务方式保证撤销/重做一致性
- 分类删除前校验关联记录并提示用户转移或保留
- 预算超标时实时通知，不可直接消失