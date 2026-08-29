# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

`dsh-skill-injector` 是 deepseek-harness（dsh）的一个插件：预设常用 skill 组合（如 `/grill-me` 等），用户无需每次对话前手动输入，由插件自动填充到对话框中。

需求文档：`docs/需求/全局.md`，开发前先阅读。

## ⚠️ 高压线（绝对禁止，触犯即违规）

1. **绝对禁止直接修改 dsh 的各项配置**：包括但不限于 `$DSH_HOME` 下的 profile/配置文件、dsh 自身 `node_modules`、dsh web 构建产物等一切 dsh 侧文件。
2. 所有改动**只允许发生在本项目**（`dsh-skill-injector/`）代码内。
3. **测试插件可用性时，当且仅当使用官方的安装/卸载方式**，且**测试由用户亲自执行**：
   - 正式安装/卸载（官方命令）：`dsh plugin --profile <name> add|remove <package>`
   - 本仓库**不维护** `--patch` 本地开发加载配置（`cordis.yml` 含绝对路径，开源会泄露个人信息），不使用该方式
4. **绝对禁止自启动 dsh 服务（如 `dsh web`、`dsh --profile` 等）做自动化测试/验证**——包括后台启动、临时启动、换端口启动。开发交付物是项目内代码与说明；安装、卸载、测试全部由用户亲自执行。
5. 任何"绕过官方机制、手改 dsh 配置来让插件生效"的做法都视为违规，立即停止并汇报。

## 核心需求

- **预设组**：多套常用的 skill 组合，可切换使用
- **预设选择器**：放在对话框中 `FULL ACCESS` 切换按钮之后，UI 样式与之一致
- **管理入口**：在 dsh 的 设置 → 插件 → 插件配置 中完成预设组的增删改查、启用/禁用
- 点击选择器可看到已启用的预设组

## 插件开发框架（Cordis）

dsh 插件基于 Cordis 框架，官方教程：`docs/deepseek-harness插件开发指南.md`（https://deepseek-harness.github.io/deepseek-harness/develop/basic/）

- 插件根目录的 `cordis.yml` 是本地插件加载配置（覆盖层），通过 `insert` 引入插件入口文件的**绝对路径**，例如：
  ```yaml
  - insert:
      - id: hello
        name: '/absolute/path/to/.../src/index.ts'
  ```
- 插件入口是导出 `apply(ctx: Context)` 的 TS 模块，三种形态：函数形式（`export const name` + `export function apply`）、对象形式（`export default { name, inject, apply }`）、类形式（`extends Service`，向其他插件提供服务）
- 依赖服务通过 `inject` 声明（如 `['tools']`），框架保证依赖就绪后才加载插件
- 通过 `ctx` 注册的资源在插件卸载时自动清理；需要手动清理的资源用 `ctx.effect()`
- 插件测试统一走官方安装/卸载：`dsh plugin --profile web add|remove <package>`（本仓库不提供 `--patch` 覆盖层配置）

## 目录结构

```
dsh-skill-injector/
├── package.json            # dsh.client 声明 + exports["./client"] → lib/client.js
├── src/
│   ├── index.ts            # Host 半区：Config schema + settings 接线 + validate
│   ├── client.tsx          # 客户端半区源码（JSX，构建为 lib/client.js）
│   └── ambient.d.ts        # 最小类型桩（react / primitives 由浏览器运行时提供）
├── scripts/build.mjs       # esbuild 构建客户端半区（pnpm build）
├── lib/client.js           # 构建产物（已提交；改客户端代码后需重新 pnpm build）
├── docs/
│   ├── deepseek-harness插件开发指南.md  # 官方教程入口
│   └── 需求/全局.md                     # 需求定义
├── CONTEXT.md              # 领域术语表
└── README.md               # 使用/构建/测试说明
```

> 说明：仓库**不包含** `cordis.yml`/`--patch` 本地加载配置——它需要写入项目绝对路径，开源会泄露个人信息；插件统一走官方 `dsh plugin add/remove` 安装。

## 常用命令

- `pnpm build`：构建客户端半区 → lib/client.js（dsh HMR 监视此文件，重新构建后浏览器免刷新热更）
- `pnpm typecheck`：tsc --noEmit 类型检查
- `pnpm install:plugin`：官方安装（`dsh plugin --profile web add "$PWD"`，在仓库目录内执行）
- `pnpm uninstall:plugin`：官方卸载
