# REFERENCE — dsh 插件开发速查（自包含）

> 与 SKILL.md 配套的详细参考：踩坑速查、术语表、关键代码片段、FAQ。
> 本文件自包含，不依赖任何仓库路径，可随技能整体搬迁。

## 1. 踩坑速查（症状 → 根因 → 修复）

| # | 症状 | 根因 | 修复 |
|---|---|---|---|
| 1 | 研究阶段烧掉 30M+ token | 没先建最小回路就全面深挖源码 | 先 hello world 跑通，再按需深入；优先读官方现成插件当模板 |
| 2 | 以为浏览器能加载 TS 前端 | 浏览器加载器用 `new Function` 执行，不认 TS/JSX | 前端必须 esbuild 预构建为纯 JS（`__ModuleLoader__.load` 形态）；JSX 必须写在 `.tsx` |
| 3 | 宿主加载成功但 UI 永不出现 | insert 的 name 指向 `.ts` 文件，`require.resolve(<name>/package.json)` 探测失败 | name 指向**包根目录**（含 package.json 的目录） |
| 4 | cordis.yml 要写绝对路径 | `--patch` 本地加载天生如此 | 放弃 `--patch`，只走官方 `dsh plugin add/remove`；仓库不维护 cordis.yml |
| 5 | `dsh plugin add` 显示成功但毫无变化 | 缺 `dsh.bundle` 声明，被当普通依赖装（安装输出有警告） | 三声明齐活：`dsh.bundle.patch` + `exports["./client"]` + 入口；装后查 bundles 列表 |
| 6 | `ctx.logger?.info('loaded')` 静默无效 | cordis 4.x 的 `ctx.logger` 是服务工厂 | `ctx.logger('名字')` 拿实例，或直接用 `console.log` |
| 7 | UI 渲染崩溃 `reading 'store'` of undefined | `useSyncExternalStore(scope.subscribe, scope.getSnapshot)` 裸传方法丢 this | 箭头函数包裹：`useSyncExternalStore((cb) => scope.subscribe(cb), () => scope.getSnapshot())` |
| 8 | 每条消息重复注入技能，token 滚雪球 | 技能是**会话级激活**的，重复注入无去重 | 技能调用行只注入一次；普通文本每条带没问题（定位转折点） |
| 9 | git 事故三连 | `.pnpm-store`（33MB 缓存）被 add -A 误提交；amend 时 index 状态混乱 | `.gitignore` 加 `.pnpm-store/`；提交前 `git status`；soft reset 找回内容（不动工作区） |
| 10 | 开源前发现绝对路径/真实姓名/邮箱在历史里 | 未做隐私审计 | 扫绝对路径/用户名/邮箱/IP；git 作者匿名化（noreply）；`reflog expire` + `gc --prune=now`；`git fsck` 验证 |
| 11 | README 越写越长、术语混乱 | 文档组织无规划 | README 精简为门面页，细节拆 docs/zh + docs/en；术语统一"前端/后端" |
| 12 | `require("@deepseek-ai/dsh-client-store")` 报 missed the module table | **基线版本错位**：该包在官方 master 的 PLATFORM_MODULES 基线里，但 npm 最新发布版（0.1.1-rc.2）没有 | 开发前先确认 harness 版本与官方支持面；未发布 → 用 settingsScope + uSES（坑 7 写法），等基线发布后切回 store 写法 |

## 2. 术语表

| 术语 | 含义 |
|---|---|
| host half / client half | dsh 官方叫法，即**后端 / 前端**（本项目文档统一用后者） |
| bundle（组合包） | 附带一个配置层的 npm 包，manifest 声明 `dsh.bundle`，回答"这个包贡献什么" |
| profile | `$DSH_HOME/profiles/<name>` 下的可启动组合目录，manifest 声明 `dsh.profile.bundles` |
| `dsh.bundle.patch` | package.json 里指向 patch 文件（如 `cordis.patch.yml`）的字段，安装时挂载为 profile 层 |
| `exports["./client"]` | 前端产物约定子路径，dsh 找浏览器代码就认它（`lib/client.js`） |
| `dsh.client.inject` | package.json 里声明的浏览器侧依赖服务列表（slots/locale/settingsScope…） |
| `dsh.client.platform` | 客户端声明，取 `"web"` |
| PLATFORM_MODULES | shell 冻结模块表（react、cordis、ui-primitives、dsh-client-store…），插件 bundle 的 external 引用从这里解析 |
| `apply(ctx)` | 插件启动函数；通过 `ctx` 注册的资源卸载时自动清理 |
| `inject` | 依赖服务声明，框架保证就绪后才加载插件 |
| `ctx.effect()` | 手动资源（定时器、订阅）注册，卸载时执行返回的清理函数 |
| settingsNamespace / installSettingsSection | dsh-settings 官方导出：命名空间 + 配置接线（schema、校验、持久化） |
| settingsScope | 浏览器侧 settings 服务，`bind({namespace})` 返回 `{getSnapshot, subscribe, set}` 裸数据源 |
| hooks 口子 | slot 注册 inject face 里的 `hooks: { name: 裸数据源 }`，渲染器绑成 `use<Name>()` 钩子（官方家规：业务组件零手写订阅） |
| `__ModuleLoader__.load` | 前端 bundle 的浏览器端标准包装形态 |
| `--dump-config` | 官方离线验证命令：`dsh --profile <name> --dump-config` 打印各层配置 |

## 3. 关键代码片段

### 3.1 settingsScope 读取（无 store 基线时的验证写法，坑 7/12）

```tsx
// 必须箭头函数包裹，否则 useSyncExternalStore 调用时丢失 this（scope 方法依赖 this.store）
const snap = useSyncExternalStore(
  (listener: () => void) => scope.subscribe(listener),
  () => scope.getSnapshot(),
)
const config = snap.status === 'ready' ? snap.value : undefined
```

### 3.2 settingsScope 读取（store 基线就绪后的官方家规写法）

```tsx
// ① createSnapshotStore 来自 @deepseek-ai/dsh-client-store（PLATFORM_MODULES 基线，构建时 external）
// ② apply 内：const store = createSnapshotStore<T>(初始值)；订阅 scope 同步 store
// ③ slots.register 的 inject face：hooks: { presetConfig: store } + 纯回调 actions
// ④ 组件 props 收到 usePresetConfig(selector) 钩子，直接读；渲染器是唯一 uSES 桥梁
// 参考实现：dsh-message-injector 官方对照.md 与 dsh-client-ui-settings-plugins（官方第一方）
```

### 3.3 后端 settings 接线（官方 installSettingsSection）

```ts
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'

export const NS = settingsNamespace('my-plugin')
export const Config = z.object({ /* schema */ })

export function apply(ctx: Context) {
  installSettingsSection(ctx, NS, Config, 默认值, {
    setSource(current) { /* 保存 live source */ },
    onChange() { /* 外部变化 */ },
    validate(value) { /* 硬校验，throw 即拒绝写入 */ },
  })
}
```

### 3.4 构建要点（build.mjs）

- 后端：esbuild `format: 'esm'`，`@deepseek-ai/schemastery`、`@deepseek-ai/dsh-settings` 保持 external。
- 前端：esbuild `format: 'cjs'` + `jsx: 'automatic'`，external：`react`、`react/jsx-runtime`、`@deepseek-ai/dsh-client-ui-primitives`（及基线就绪后的 `@deepseek-ai/dsh-client-store`）；产物包一层 `window.__ModuleLoader__.load({id, factory})`。

## 4. FAQ

**Q：插件怎么工作的？** 后端管配置（schema/校验/持久化），前端管 UI（槽位组件）；两端通过官方服务（settingsScope 等）通信。改代码：只改前端刷新浏览器；改后端或不确定就重启 dsh（后端模块启动时读进内存，不重载）。

**Q：为什么不能直接改输入框 DOM？** 输入框是 React 受控组件，直接改 DOM 不同步 React 状态；必须走官方通道（如 `input.setDraft(text)`，一次事务可撤销）。

**Q：本地安装和 GitHub 安装区别？** 本地路径 = 软链接（改代码 build + 重启即生效）；GitHub = 克隆副本（拉的是源码，需 `prepare` 脚本 + pnpm `allowBuilds` 授权，且建议锁定 commit；或发布 npm / 交付 `pnpm pack` tarball 免构建权限）。详见官方对照.md。

**Q：为什么不用 `--patch`？** 它要绝对路径（开源泄露隐私）。`--patch` 是官方教程的开发 overlay，`dsh plugin add` 是官方安装路径，本项目统一后者。

**Q：settings 存哪？** `$DSH_HOME/settings.yaml` 的命名空间抽屉，跨会话/刷新/标签页保持。

**Q：这些经验对新插件最值钱的是？** 先确认机制再定产品、最小回路先行、三声明缺一不可、开发前确认 harness 版本与官方支持面、测试走官方路径由用户执行、产物提交、开源前隐私审计。
