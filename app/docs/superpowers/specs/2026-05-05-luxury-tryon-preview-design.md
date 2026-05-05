# Luxury Try-On / Preview Visual Redesign Spec

## Summary

本次改版把 `tryon` 和 `preview` 两个现有页面统一进首页已经建立的奢侈品视觉系统中，目标是形成一条完整的 `Home → Try-On → Preview` 体验链路。

改版重点是视觉与信息架构，不改现有业务逻辑、状态流、API 调用和核心交互能力。

## Product Goal

- 让 `tryon` 从普通多步骤工具页升级为具有叙事节奏的分镜式生成页。
- 让 `preview` 从基础编辑页升级为摄影棚式精修工作台。
- 保持用户对现有功能的学习成本接近不变，同时显著提升品牌一致性与高级感。

## Page Roles

### Home

- 角色：品牌入口与 AI 试衣产品入口。
- 作用：建立 `black / silver / soft white` 的奢侈品母题，并将用户引导到 `tryon`。

### Try-On

- 角色：引导式生成页。
- 作用：完成人物上传、服装选择、试穿模式选择、结果生成。
- 视觉定位：像时装 campaign 的 backstage journey，每一步像一个独立镜头，而不是一个白卡中的 tab 切换。

### Preview

- 角色：精修工作台。
- 作用：完成背景上传、衣物拖拽缩放、构图调整和图片导出。
- 视觉定位：像杂志摄影棚中的编辑台与成片舞台，而不是 demo 画布页。

## Scope

### In Scope

- 重构 `tryon` 页面框架、排版、材质、步骤表现和文案层级。
- 重构 `preview` 页面布局、控制区层级、画布舞台表现和动作区样式。
- 复用首页的 luxury design tokens 与材质体系。
- 保持 `Home → Try-On → Preview` 之间的视觉连续性。

### Out of Scope

- 不修改 `tryon` 的业务流程、状态机、轮询逻辑和 API 调用。
- 不重构 `preview` 的 canvas 行为、拖拽逻辑和导出逻辑。
- 不合并 `tryon` 与 `preview` 为一个新页面。
- 不处理与本次改版无关的历史 warning 或组件重构。

## Try-On Information Architecture

`tryon` 保留当前四步流程，但要从“单卡片内切换内容”改成“分镜式步骤画面”。

### Step 1: Upload Person

- 视觉重点是人物照片上传。
- 页面应给用户明确的开场感，像确定本次试穿的主角。
- 只保留与当前动作最相关的说明信息，不叠加多余辅助信息。

### Step 2: Choose Look

- 保留“上传衣服”和“从衣橱选择”两条现有路径。
- 这一屏的重点是造型选择，视觉上更接近 look selection，而不是文件管理。
- 已保存衣物列表仍按现有数据逻辑工作，但样式需要更像时装选片墙。

### Step 3: Pick Framing

- 保留“半身试穿 / 全身试穿”的现有能力。
- 这一屏应表现为对构图与成片范围的决定，而不是普通二选一设置。

### Step 4: Generate Result

- 保留现有生成中、轮询中、成功、失败状态。
- 成功结果要成为页面视觉中心。
- 需要明确提供进入 `preview` 的动作承接，形成从生成到精修的自然过渡。

## Preview Information Architecture

`preview` 保留现有编辑能力，但页面结构调整为“控制列 + 主舞台”。

### Left Rail

- 放置背景上传、衣物列表、当前动作和导出按钮。
- 宽度应克制，作为编辑台，不应与主画布争夺视觉重心。
- 信息密度比现在更高，但呈现方式更精致、更清楚。

### Main Stage

- Canvas 区域成为整页绝对主视觉。
- 舞台应具备“成片检查区”的感觉，强调作品本身，而不是工具边框。
- 背景氛围允许有轻量 bloom 与高光，但不能影响用户对图像的判断。

### Top Status Layer

- 放置轻量标题、当前位置与页面语义，如 `Preview Atelier`。
- 不能做成传统后台工具栏。

## Shared Visual System

两个页面延续首页的统一视觉母题，不引入新的主色系统。

### Palette

- 主背景：接近纯黑的深色层次。
- 主文本：柔和冷白。
- 辅助色：银灰、透明白描边。
- 禁止重新引入蓝紫色 AI 产品视觉。

### Typography

- 标题：继续使用 serif italic 风格，承担叙事与品牌气质。
- 正文、说明、控制信息：使用清晰的 sans-serif，保证可读性。

### Materials

- 复用 `lux-page`、`lux-surface`、`lux-surface-strong`、`lux-outline`。
- 容器统一为液态玻璃质感、轻模糊、细高光描边。
- 阴影应深、薄、克制，不做厚重漂浮卡片。

### Motif Usage

- 花图不在 `tryon` 和 `preview` 中整张重复出现。
- 只抽取其高光弧线、冷白 bloom、深黑留白和银色反射感，作为母题残影。

### Motion

- 保留轻量 blur-in、fade-up 和柔和状态过渡。
- 不新增高成本炫技动效，不让动效干扰上传、选择和编辑操作。

## Implementation Boundaries

### Try-On

- 允许修改页面结构、类名组合、容器层级、步骤标题表现和说明文案。
- 不允许改动上传行为、生成请求、轮询逻辑、错误处理语义和步骤顺序。

### Preview

- 允许修改页面布局、面板样式、舞台容器和信息层级。
- 不允许改动 canvas 的核心编辑功能、保存逻辑和现有数据结构。

## Acceptance Criteria

- 用户从首页进入 `tryon` 时，不再感受到风格断层。
- `tryon` 在不改业务逻辑的前提下，视觉上明显呈现四步分镜节奏。
- `preview` 在不改编辑逻辑的前提下，视觉上明显成为摄影棚式精修台。
- 两页均复用首页已有 luxury 设计 token，而不是各自发明新风格。
- 页面在桌面和移动端都保持可用，且主要动作清晰可见。
- 本次改版不引入新的 lint error 或 build error。
