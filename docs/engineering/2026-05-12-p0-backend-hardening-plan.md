# P0 后端加固执行计划

## 1. 目标

在不改变现有业务闭环的前提下，完成后端 P0 加固：

- AI 试衣相关接口必须由服务端认证保护
- 高风险接口具备基础防滥用能力
- 删除类接口的认证与类型收口统一

## 2. 本轮范围

### 2.1 认证保护

- 给 `/api/ai-tryon`
- 给 `/api/ai-tryon/status`

统一增加与其他业务接口一致的登录校验。

### 2.2 限流保护

优先保护以下接口：

- `/api/auth/register`
- `/api/auth/login`
- `/api/ai-tryon`
- `/api/ai-tryon/status`

采用当前项目可承受的“基础限流”方案：

- 基于内存的窗口限流
- 明确声明为当前部署形态下的 best-effort 防护
- 优先覆盖本地开发和单实例部署场景

### 2.3 接口一致性

统一这两个删除接口：

- `/api/clothing/[id]`
- `/api/tryon-history/[id]`

去掉本地 `JWTPayload` cast，直接使用共享 `verifyToken` 返回值。

## 3. 文件范围

- `app/src/app/api/ai-tryon/route.ts`
- `app/src/app/api/ai-tryon/status/route.ts`
- `app/src/app/api/auth/register/route.ts`
- `app/src/app/api/auth/login/route.ts`
- `app/src/app/api/clothing/[id]/route.ts`
- `app/src/app/api/tryon-history/[id]/route.ts`
- `app/src/lib/jwt.ts`（如需复用辅助函数）
- `app/src/lib/*` 下新增共享限流或认证辅助文件

## 4. 实施顺序

1. 先新增共享限流工具与认证辅助函数
2. 接入注册与登录接口
3. 接入 AI 试衣与任务状态接口
4. 统一两个删除接口的 token 验证写法
5. 跑 `lint` 与 `tsc --noEmit`

## 5. 验收标准

- 未登录调用 AI 试衣相关接口会返回 `401`
- 正常登录用户仍可完成 AI 试衣主链路
- 注册、登录、AI 相关接口触发超限时返回明确错误
- 删除接口不再保留本地 JWT 类型重复定义
- `npm run lint` 和 `npx tsc --noEmit --pretty false` 通过

## 6. 本轮不做

- Redis / 分布式限流
- 用户资料更新接口
- 图片存储方案升级
- AI 任务数据库持久化
- 测试体系补齐

