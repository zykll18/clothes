# Aura Wardrobe App

应用源码位于此目录。完整的产品介绍、技术架构、本地运行和部署说明请查看仓库根目录的 [README](../README.md)。

The application source lives in this directory. See the repository-level [README](../README.md) for the full product case study, architecture, setup, and deployment guide.

## Local Development

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。
