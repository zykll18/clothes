# 穿搭预览

基于 Next.js 与 DashScope 的智能穿搭预览与 AI 试衣应用，当前开发环境以本地 SQLite 为基线，便于快速启动、验证流程和迭代产品能力。

## 技术栈

- **Next.js 16**：App Router 应用框架
- **React 19**：前端 UI 运行时
- **Tailwind CSS 4**：样式系统
- **Prisma**：数据库访问与类型生成
- **SQLite**：当前本地开发数据库
- **DashScope**：AI 试衣与图像生成能力

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

请将 `JWT_SECRET` 设置为真实随机值。配置 `DASHSCOPE_API_KEY` 后会调用真实 AI 试衣服务；未配置或上游暂时不可用时，开发环境会生成带明确标识的本地搭配演示图，确保面试与本地评审可以走通完整流程。生产环境不会使用演示回退。

Vercel 部署使用 `prisma/schema.postgresql.prisma`。在 Vercel Marketplace 中连接 Neon 后，确保项目拥有 `DATABASE_URL`，并将 Root Directory 设置为 `app`。本地开发仍使用 `prisma/schema.prisma` 与 SQLite。

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 已实现能力

- 用户注册、登录、退出与受保护页面跳转
- 本人照片上传与衣橱管理，支持类别、颜色、品牌和风格标签
- 按单品部位设置配色，选择整体风格并筛选衣橱
- 游戏式选择外套、内搭、裤装、鞋子和配饰
- 基于 DashScope 的 AI 试衣，以及开发环境本地演示回退
- 搭配预览保存、历史查看、图片下载和记录删除
- 独立画布编辑页，可上传底图并调整服饰构图

## 常用命令

```bash
npm run dev
npm run build
npm run build:vercel
npm run start
npm run lint
npm test
npm run db:generate
npm run db:push
npm run db:studio
npm run db:migrate
```

## 当前开发基线

当前仓库以 SQLite 作为开发基线，目的是降低环境准备成本并保持 Prisma 工作流简单稳定。若后续需要多用户部署、托管数据库或更复杂的并发能力，再评估迁移到 PostgreSQL；PostgreSQL 仅作为未来工作，当前运行基线仍然是 SQLite。
