# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

`dsh-message-injector` 是 deepseek-harness（dsh）的一个插件：预设常用"消息注入内容"组合（任意文本 / 技能调用），**每条消息自动注入**到输入框首行，一键启用、切换、停止。

需求文档：`docs/zh/需求.md`，开发前先阅读。
开发经验（踩坑记录与流程建议）：`docs/zh/开发经验.md`。

## ⚠️ 高压线（绝对禁止，触犯即违规）

1. **绝对禁止直接修改 dsh 的各项配置**：包括但不限于 `$DSH_HOME` 下的 profile/配置文件、dsh 自身 `node_modules`、dsh web 构建产物等一切 dsh 侧文件。
2. 所有改动**只允许发生在本项目**（`dsh-message-injector/`）代码内。
3. **测试插件可用性时，当且仅当使用官方的安装/卸载方式**，且**测试由用户亲自执行**：
   - 正式安装/卸载（官方命令）：`dsh plugin --profile <name> add|remove <package>`
   - 本仓库**不维护** `--patch` 本地开发加载配置，不使用该方式
4. **绝对禁止自启动 dsh 服务（如 `dsh web`、`dsh --profile` 等）做自动化测试/验证**——包括后台启动、临时启动、换端口启动。开发交付物是项目内代码与说明；安装、卸载、测试全部由用户亲自执行。
5. 任何"绕过官方机制、手改 dsh 配置来让插件生效"的做法都视为违规，立即停止并汇报。

## 核心需求

- **预设组**：多套常用的注入内容组合（任意文本 / 技能调用），可切换使用
- **预设选择器**：放在输入框左下角（权限选择器旁），UI 样式与之一致
- **管理入口**：在 dsh 的 设置 → 插件 → 插件配置 中完成预设组的增删改查、启用/禁用
- **自动注入**：选中后每条消息自动把内容注入输入框首行（空输入框才注入，绝不触碰已有内容）
- 点击选择器可看到已启用的预设组

## 插件开发框架（Cordis）

dsh 插件基于 Cordis 框架，官方教程：https://deepseek-harness.github.io/deepseek-harness/develop/basic/（亦见 `docs/zh/架构.md`）

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
dsh-message-injector/
├── package.json            # 插件身份证：dsh.bundle（激活）+ dsh.client（前端声明）+ exports["./client"]
├── src/                             # 按官方 half 分法：host（后端）/ client（前端）
│   ├── host/
│   │   └── index.ts            # 后端源码：Config schema + settings 接线 + validate
│   ├── shared/
│   │   └── types.ts            # 领域类型 PresetGroup/PresetConfig（两端共用，纯类型）
│   └── client/                 # 前端源码（全部浏览器代码，构建为 lib/client.js）
│       ├── index.tsx           # 前端入口（组合根：只做接线）
│       ├── types/              # 契约类型（ScopeLike/InputLike/RootCtx 等防御式服务类型）
│       ├── api/                # 数据访问（skills.ts：技能目录接口 + 30s TTL 缓存）
│       ├── services/           # 业务服务（injector.ts：自动注入轮询，F4/F5）
│       ├── logic/              # 纯业务逻辑（normalizeContent/isSkillLine/skillNameOf/cloneGroup）
│       ├── locales/            # 词典（zh/en）
│       ├── utils/              # 通用工具（scroll/css/signal/settings）
│       ├── components/         # UI 组件（ConfigCard/PresetSelector/PresetConfigCard）
│       └── ambient.d.ts        # 最小类型桩（react / primitives 由浏览器运行时提供）
├── scripts/build.mjs       # esbuild 构建（pnpm build）：后端 → lib/index.js，前端 → lib/client.js
├── lib/index.js            # 后端构建产物（已提交；改后端代码后需重新 pnpm build）
├── lib/client.js           # 前端构建产物（已提交；改前端代码后需重新 pnpm build）
├── docs/
│   ├── zh/                             # 中文文档（安装.md / 使用说明.md / 架构.md / 需求.md）
│   └── en/                             # 英文文档（install.md / usage.md / architecture.md）
├── CONTEXT.md              # 领域术语表
├── README.md               # 中文门面页（只链中文文档）
└── README_EN.md            # 英文门面页（只链英文文档）
```

> 术语约定：dsh 官方称 "host half / client half"（宿主半区/客户端半区），本项目文档统一用"**后端 / 前端**"表述（后端 = 服务端逻辑，前端 = 浏览器 UI）。
> 说明：仓库**不包含** `cordis.yml`/`--patch` 本地加载配置；插件统一走官方 `dsh plugin add/remove` 安装。

## 常用命令

- `pnpm build`：构建 → 后端 lib/index.js + 前端 lib/client.js（改代码后重新构建即生效）
- `pnpm typecheck`：tsc --noEmit 类型检查
- `pnpm install:plugin`：官方安装（`dsh plugin --profile web add "$PWD"`，在仓库目录内执行）
- `pnpm uninstall:plugin`：官方卸载
