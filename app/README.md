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

请在 `.env` 中填写真实的 `DASHSCOPE_API_KEY`，否则 AI 试衣相关功能无法正常使用；同时应将 `JWT_SECRET` 设为真实值，避免继续依赖不安全的回退密钥。开发环境默认使用本地 SQLite。

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

- 用户注册与登录
- 衣橱管理与服饰条目接口
- 穿搭预览页与基础画布交互
- 基于 DashScope 的 AI 试衣原型流程
- 试衣历史记录接口与页面流程支撑

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:push
npm run db:studio
npm run db:migrate
```

## 当前开发基线

当前仓库以 SQLite 作为开发基线，目的是降低环境准备成本并保持 Prisma 工作流简单稳定。若后续需要多用户部署、托管数据库或更复杂的并发能力，再评估迁移到 PostgreSQL；PostgreSQL 仅作为未来工作，当前运行基线仍然是 SQLite。
