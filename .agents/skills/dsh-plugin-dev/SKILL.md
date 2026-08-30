---
name: dsh-plugin-dev
description: 指导从零开发一个 deepseek-harness (dsh) 插件：先确认核心机制与 harness 版本、跑通最小回路、三声明齐活、esbuild 构建、官方安装与验收、文档同步、开源前审计。Use when the user wants to develop, scaffold, build, install, or debug a dsh plugin（如"开发一个 dsh 插件"、"write a dsh plugin"、"dsh plugin add"）。
---

# dsh 插件开发指引

> 给 agent 的操作手册：dsh 插件 = 一个前后端小应用（后端跑在 dsh 服务进程，前端跑在浏览器且必须预构建为纯 JS）。
> 素材来源：dsh-message-injector 的开发经验与官方文档逐条核对。详细踩坑/术语见 [REFERENCE.md](REFERENCE.md)，与官方文档的出入见 [官方对照.md](官方对照.md)，最小骨架见 [templates/](templates/)。

## 高压线（硬规则，违反即错）

1. **不自启动 dsh 服务**做自动化验证（`dsh web`、`dsh --profile` 都不行）；安装/卸载/测试由**用户亲自执行**官方命令。
2. 只走官方安装路径：`dsh plugin --profile <name> add|remove <包>`。**不维护 `--patch`/cordis.yml 本地加载**（绝对路径泄露隐私）。
3. 不修改 `$DSH_HOME`、dsh 自身文件、dsh 配置——一切改动只发生在插件项目内。
4. 前端必须**预构建纯 JS**（浏览器无 TS 编译）；构建产物 `lib/` 提交进仓库（即装即用）。

## 工作流（按顺序，每步有产出）

### 1. 先确认核心机制、harness 版本、官方支持面，再定产品形态

- 机制：确认"这个功能在 dsh 里到底怎么生效"。**一个事实可能推翻整个定位**——例：技能是会话级激活的，做成"每条消息重复注入技能"会烧 token，定位必须改。
- 版本：查 harness 版本（npm `@deepseek-ai/dsh` 的 dist-tags；本机 `node_modules/@deepseek-ai/dsh/package.json`）。
- 支持面：确认要用到的 API/基线包在**当前发布版本**里是否存在。例：`@deepseek-ai/dsh-client-store`（PLATFORM_MODULES 基线种子）目前只在官方 master 分支，npm 最新版 0.1.1-rc.2 没有——**官方 master 有 ≠ 你装的有**。
- 没有官方支持 → 用本项目验证过的等价写法（见 REFERENCE.md 坑 12），并在文档注明"待基线发布后切换"。
- 产出：机制 + 版本 + 支持面三段结论，写进需求文档。

### 2. 最小回路（hello world 先跑通）

- 用 [templates/](templates/) 建包；后端 `apply(ctx)` 里 `console.log`；`pnpm build`。
- 用户执行 `dsh plugin --profile <name> add <仓库路径>`（本地路径 = 软链接，改代码后 build + 重启即生效）→ 重启 dsh → 终端见日志。
- 产出：包结构 → 构建 → 安装 → 加载**全链路通**。之后每加功能都小步验证。研究要克制：优先读官方现成插件当模板，别全局深挖源码（坑 1）。

### 3. 三份声明齐活（缺一个都"装了不生效"）

- `package.json`：`dsh.bundle.patch`（指向 `cordis.patch.yml`）+ `exports["./client"]`（前端入口）+ `main`/`exports["."]`（后端入口）。
- `cordis.patch.yml`：`- insert: {id, name: 包名}`——**只用包名**（Node 模块解析），不用绝对路径。
- 装完检查：profile 的 bundles 列表有插件名；或 `dsh --profile <name> --dump-config` 看到本插件层。

### 4. 构建（esbuild 双产物）

> 目录约定：`src/` 按官方 half 分法分 `src/host/`（后端）/ `src/client/`（前端）两个目录；
> `src/shared/` 放两端共用的领域类型（纯类型，无运行时）。`src/client/` 根目录只放入口
> （组合根，只做接线），其余按职责归目录：
> `types/`（契约类型）`api/`（数据访问）`services/`（业务服务）`logic/`（纯业务逻辑）
> `locales/`（词典）`utils/`（通用工具）`components/`（UI 组件）。
> 模板自带案例代码撑起目录结构（git 不追踪空目录），文件可直接 `cp` 复用。

- `src/host/index.ts` → `lib/index.js`（后端 ESM，依赖保持外部解析）。
- `src/client/index.tsx` → `lib/client.js`（前端，`window.__ModuleLoader__.load` 包装形态；react、primitives 等运行时依赖 external，由 shell 模块表提供）。**JSX 必须写在 `.tsx` 文件**（`.ts` 不解析 JSX）。

### 5. 功能开发与迭代

- 后端：Config schema（schemastery）+ settings 接线（`installSettingsSection`/`settingsNamespace`）；改后端必须重启 dsh。
- 前端：UI 走 `ctx.slots.register`（槽位名见官方运行时，如 `conversation.input.left`、`settings.plugin.item`）；读数据用 settingsScope，**先按步骤 1 确认基线**：支持 store 基线 → `createSnapshotStore` + inject face 的 `hooks` 口子（渲染器绑成 `use<Name>()` 钩子，官方家规）；不支持 → `useSyncExternalStore` + **箭头函数包裹**（裸传方法丢 this 会渲染崩溃，坑 7）；写数据一律 `scope.set`（经后端校验与持久化）。
- 只改前端 → 刷新浏览器；改后端或不确定 → 重启。

### 6. 文档与改名同步

- 改名/改定位：`grep -rn "旧名|旧术语"` 全库扫描逐个甄别；代码、注释、配置、文档一起改，README 精简为门面页，细节拆 docs/zh + docs/en。

### 7. 开源前隐私审计

- 扫描绝对路径/用户名/邮箱/IP；git 作者匿名化（GitHub noreply 邮箱）；`git reflog expire --expire=now --all && git gc --prune=now` 清旧对象；`git log --format='%an <%ae>'` 验证全匿名；`git fsck --unreachable` 无残留。提交信息别带个人信息。

## 参考

- [REFERENCE.md](REFERENCE.md)：踩坑速查（症状→根因→修复）+ 术语表 + 关键代码片段 + FAQ
- [官方对照.md](官方对照.md)：与官方文档逐条出入 + 官方出处 + 采用结论
- [templates/](templates/)：最小可跑骨架，复制即改（注释指路完整功能参考 dsh-message-injector 仓库）
