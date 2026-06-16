# 设计规范

## 1. Design Tokens

### 主色
| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#4F46E5` | 按钮、链接、焦点环 |
| `--color-primary-hover` | `#4338CA` | 悬停 |
| `--color-primary-light` | `#EEF2FF` | 浅背景 |

### 灰阶（Tailwind 风格）
`50→950` 完整 12 级：`#F9FAFB` → `#030712`

### 语义色
| Token | 值 | 用途 |
|-------|-----|------|
| income/success | `#059669` | 收入 |
| expense/danger | `#DC2626` | 支出 |
| warning | `#D97706` | 警告 |

## 2. 排版
- **字体**: Inter (Google Fonts)，回退系统无衬线栈
- **层级**: 标题 Bold 700-800，正文 Regular 400，标签 SemiBold 600
- **行高**: 标题 1.25，正文 1.6
- **字号**: 12/13/14/16/18/22/28/36px

## 3. 间距
- 8px 网格系统
- `--space-1:8` / `--space-2:16` / `--space-3:24` / `--space-4:32` / `--space-5:40` / `--space-6:48`

## 4. 圆角
- 按钮/输入框: 8px
- 卡片: 20px
- 弹窗: 24px

## 5. 阴影
- `--shadow-xs` → `--shadow-xl`：6 级系统
- `--shadow-colored`: 主色半透明（`rgba(79,70,229,0.15)`）
- `--shadow-inner`: 输入框凹陷

## 6. 动画
- 缓动: `cubic-bezier(0.4, 0, 0.2, 1)`（Material Standard）
- 入场: 150ms / 200ms / 300ms
- 页面：卡片依次淡入上浮，交错 50ms
- 悬停: 卡片上浮 4px + 阴影加深
- 按钮: hover 上浮 2px，active 缩放 .98

## 7. 移动端规范

### 底部导航
- ≤768px 显示，替代侧边栏
- 4 个 Tab：记账/分类/统计/预算
- 图标+文字，最小触摸区 44px

### 表格 → 卡片
- ≤768px 表格行变为独立卡片
- 竖排信息层级清晰

### 安全区域
- `padding-bottom: env(safe-area-inset-bottom)`
- `viewport-fit=cover`

### 触摸
- 最小点击区 44×44px
- 输入框高度 ≥44px
- 间距 ≥8px 防误触

## 8. 图标
- 侧边栏导航使用 Emoji（桌面端可接受）
- 移动端考虑换 Lucide Icons（可选）
