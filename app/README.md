# 穿搭预览应用

一个基于 Next.js 的智能穿搭预览平台，帮助用户在购买衣物前预览搭配效果。

## 功能特性

- ✅ 用户注册和登录
- ✅ 个人照片上传
- ✅ 衣物图片管理
- ✅ 2D 搭配预览（使用 Fabric.js）
- ✅ 实时拖拽和调整
- ✅ 搭配方案保存
- ✅ 响应式设计

## 技术栈

### 前端
- **Next.js 14** - React 框架，支持 App Router 和 SSR
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Fabric.js** - 2D Canvas 库

### 后端
- **Next.js API Routes** - API 服务
- **Prisma** - ORM 框架
- **PostgreSQL** - 关系型数据库

### 认证
- **JWT** - 用户认证
- **bcrypt** - 密码加密

## 项目结构

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # 认证页面
│   │   │   ├── login/         # 登录
│   │   │   └── register/      # 注册
│   │   ├── preview/           # 预览功能
│   │   ├── wardrobe/          # 衣物管理
│   │   └── api/              # API 路由
│   ├── components/            # React 组件
│   │   ├── ui/               # UI 组件
│   │   ├── layout/           # 布局组件
│   │   ├── canvas/           # Canvas 组件
│   ├── lib/                   # 工具库
│   │   ├── prisma.ts         # Prisma 客户端
│   │   ├── jwt.ts            # JWT 工具
│   │   ├── validations.ts     # 表单验证
│   │   └── constants.ts      # 常量定义
│   ├── types/                 # TypeScript 类型
│   └── hooks/                # 自定义 Hooks
├── prisma/                   # Prisma 配置
│   └── schema.prisma        # 数据库模式
└── public/                   # 静态资源
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库 URL 和其他配置。

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库模式
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 数据库操作
npm run db:push          # 推送模式到数据库
npm run db:studio        # 打开 Prisma Studio
npm run db:migrate      # 运行数据库迁移
npm run db:generate     # 生成 Prisma 客户端
```

## 核心功能说明

### 用户认证

- **注册**：`/api/auth/register`
- **登录**：`/api/auth/login`
- 使用 JWT token 进行认证，存储在 HttpOnly Cookie 中

### 2D 预览

- 基于 Fabric.js 实现
- 支持拖拽、缩放、旋转
- 实时更新位置和状态
- 支持保存为图片

### 衣物管理

- 上传衣物图片
- 分类管理
- 标签系统
- 品牌和价格信息

## 数据库模式

### 用户表 (User)
- 基本信息：邮箱、姓名、头像
- 身体数据：身高、体重、体型
- 关联关系：衣物、搭配、偏好

### 衣物表 (ClothingItem)
- 物品信息：名称、分类、图片
- 属性信息：颜色、品牌、价格、尺码、材质
- 变换信息：位置、缩放、旋转、透明度

### 搭配表 (Outfit)
- 搭配信息：名称、描述
- 社交功能：公开状态、点赞数
- 关联关系：用户、衣物项

## 部署

### 阿里云部署

1. 准备阿里云 RDS PostgreSQL 数据库
2. 配置阿里云 OSS 对象存储
3. 设置环境变量
4. 部署到阿里云 ECS 或使用 Serverless 服务

### 腾讯云部署

1. 准备腾讯云 PostgreSQL 数据库
2. 配置腾讯云 COS 对象存储
3. 设置环境变量
4. 部署到腾讯云 CVM 或使用 Serverless 服务

## 待开发功能

- [ ] 3D 人体模型预览
- [ ] AR 试衣功能
- [ ] 智能搭配推荐
- [ ] 社交分享功能
- [ ] 移动端 APP
- [ ] 电商集成
- [ ] AI 搭配助手

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发者。
