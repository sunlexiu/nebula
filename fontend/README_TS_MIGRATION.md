# Deego TypeScript 一步到位迁移包

本包在不改变功能/样式的前提下完成了：
- 所有前端 `*.jsx` → `*.tsx`、`*.js` → `*.ts` 的文件级迁移（源码内容保持不变）。
- 新增 `tsconfig.json`（严格模式，但暂时允许 `noImplicitAny: false` 以保证可编译）。
- 新增类型地基：`src/types/{tree.ts, api.ts, sql.ts}`。
- 新增统一请求封装：`src/lib/request.ts`。
- 将入口 `index.html` 的入口脚本改为 `/src/main.tsx`。

> 注：为了**一步到位可运行**，当前配置对 `any` 持宽松策略。后续可按你的节奏逐步收紧。

## 使用
1. `pnpm i` / `npm i` / `yarn` 安装依赖
2. `pnpm dev` / `npm run dev` 启动开发环境

## 后续建议（可选）
- 将各处 `fetch` 切换到 `request<T>`，享受统一错误处理与类型收敛。
- 逐步在关键模块补强类型（Tree/Actions/Modals/Editor）。
- 收紧 `tsconfig` 中的 `noImplicitAny`。

后端源码原样保存在 `backend-src/` 以供参考，无需改动即可配合现有前端运行。