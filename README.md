# dsh-term-explainer

一个 DeepSeek Harness（DSH）cordis 插件：在对话中**选中文本 → 出现「解释」按钮 → 点击后右侧弹出对话框**，结合上下文用当前默认模型解释所选文字，并支持多轮追问。

- 服务端（Host）半：注册 `/api/term-explainer/explain` 接口，调用 `llm` 生成解释。
- 浏览器（Client）半：文本选中监听、浮动「解释」按钮、可拖动/缩放的对话框、亮暗模式适配。

## 仓库结构

```
term-explainer/
├── package.json          # name / version / dsh 声明 / dsh.client / peerDeps
├── cordis.patch.yml      # 注册 host 半的插件行（市场安装时自动应用）
├── tsconfig.json
├── src/
│   ├── index.ts          # Host 半（webServer 路由 + llm）
│   └── client/
│       └── index.tsx     # Client 半（选区按钮 + 对话框 UI）
└── README.md
```

构建产物（`lib/index.js` 与 `lib/client.js`）不提交，由 `tsdown` 生成。

## 发布到 DSH 插件市场

1. 把本仓库推到 GitHub；
2. 修改 `package.json` 的 `repository.url` 与 `name`（保持唯一，先在 npm 查重）；
3. 仓库 **Settings → Topics 添加 `dsh-plugin`**（可再加 `dsh`、`deepseek-harness`、`cordis-plugin`）；
4. 市场 CI 每 2 小时扫描一次 `dsh-plugin` topic，**最迟 2 小时自动收录**，无需人工申请。

市场：[bradeGithub/DSH-Plugins-Marketplace](https://github.com/bradeGithub/DSH-Plugins-Marketplace)
作者规范：[STANDARD.md](https://github.com/bradeGithub/DSH-Plugins-Marketplace/blob/main/STANDARD.md)

可选：`npm publish` 发布到 npm registry（非必需，市场从 GitHub 直连安装）。

## 用户安装方式

- Web GUI：设置 → DSH插件市场 → 找到本插件 → 一键安装；
- 或官方 CLI：`dsh plugin --profile web install lizhicai-geh/term-explainer`；
- 本地开发安装（从本仓库直接链接进 profile）：

  ```bash
  pnpm install && pnpm build
  dsh plugin --profile web add .
  ```

- 安装后**重启 DSH**（重新运行 `dsh web`）再刷新页面。

> 市场收录前提：GitHub 仓库页 Settings → Topics 添加 `dsh-plugin`（市场 CI 每 2 小时扫描一次）。

## 构建

```bash
pnpm install
pnpm build     # tsdown → lib/index.js（host）+ lib/client.js（client bundle）；tsc → lib/types
```

- `tsdown.config.ts` 双入口：Node 半（ESM）与浏览器半（CJS，`window.__ModuleLoader__.load({ id, factory })` 形态，
  外部化平台种子模块 `react` / `react/jsx-runtime` 等，其余全部内联）；
- 声明文件由 `tsc --emitDeclarationOnly` 产出到 `lib/types`（对应 package.json 的 `types`/`exports`）；
- `prepare` 脚本保证 git/本地链接安装时自动构建。

## 关键设计说明

- **RPC**：刻意用 `webServer` HTTP 路由 + 浏览器 `fetch`，避免 typert `@Remote` 代码生成。
  若需要会话鉴权 / 接入 DSH 的 typert 远程体系，可改为 `@Remote` 服务 + `dsh-api-remotes`。
- **宿主接口包**：`@deepseek-ai/dsh-*` 全部放在 `peerDependencies`（构建所需放 `devDependencies`），
  **禁止**进 `dependencies`，否则旧版副本会遮蔽宿主（见 STANDARD §6.6）。
- **双面声明**：`dsh.bundle.patch` 注册 host 半，`dsh.client` 声明 client 半（含 `inject` 客户端依赖边）。
- **更新**：改代码后必须 bump `version`，否则市场的「更新」按钮不会出现。

## 自测清单（提收录前）

```bash
git clone <your repo> /tmp/x
node -e "const p=require('/tmp/x/package.json');console.log(p.dsh, p.main, p.repository)"
# 预期：dsh 对象存在；repository 指向本仓库
pnpm install && pnpm build && ls lib/index.js lib/client.js
```

## 待对齐点

- `src/index.ts` / `src/client/index.tsx` 里的结构类型（`LlmLike`、`WebServerLike`、`any`）可在真实仓库换成
  `@deepseek-ai/dsh-llm` 等官方类型（当前已按 rc.7 的宿主 API 对齐：`webServer.register`、`llm.stream` 块协议、
  `agentDefaultModel.currentSelection`、client 侧 `slots`/`locale` 服务）。
