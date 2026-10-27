# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

（暂无）

## [0.2.1] - 2026-10-28

适配 dsh 0.2（0.2.1-rc.2）。配置系统与图标命名都在 0.2 变过，本版把插件重做成**纯前端**：
配置存浏览器 localStorage，注入走 `input.setDraft`，宿主端只保留加载入口。

### Fixed

- **插件整体不加载**：cordis `inject` 收窄为 `slots` / `locale`，`sessions` / `connection` 改为运行时 `ctx.get` 按需取，服务缺失只降级不阻塞加载
- **入口不显示**：0.2 把 primitives 图标改名（`IconXxxOutline14/16` → `OutlineRegular/Medium`），旧名是 `undefined` 组件会让槽位渲染崩溃；改为自带的 `components/icons.tsx` 内联 SVG，只保留 `Menu` 依赖
- **虚拟列表打转**：`getSnapshot` 返回新对象会触发 React「getSnapshot should be cached」，改为底层快照不变时复用同一包装对象
- **自动注入失效**：0.2 的 `sessions.list` 快照没有 `current` 字段。会话 id 改从会话作用域槽位的标准 props（`SessionStandardProps.sessionId`）取，并放到模块级单例（热重载不丢）
- **写入被拒**：0.2 的配置写入要过 volatile 字段与宿主校验，会出现「宿主拒绝了这次写入」→ 见下方 Changed

### Added

- **预设管理弹窗**：选择器菜单底部「配置」直接弹出，增删改查/排序/启用禁用全在弹窗内。用原生 `<dialog>` + `showModal()`，定位/遮罩/层级交给浏览器 top layer（自绘 overlay 会被宿主布局带偏到左上角）；Esc、点遮罩、右上 × 关闭
- **一次一填 + 删空反选**：一次「选中预设 + 会话」只自动填一次；手动把输入框删空时**立即**取消选中（订阅输入状态，不等 500ms 轮询）。重新允许填充：菜单里再选一次预设、切换会话、消息发送完成之后
- 加载/槽位注册/跳过原因等 Console 诊断日志

### Changed

- **配置改存 localStorage（纯前端）**：键 `dsh-message-injector:config`。不再经过 dsh 配置系统，即时生效、无需重启；宿主端去掉 `Config` schema 与 `ctx.settings.configure`，依赖里去掉 `@deepseek-ai/schemastery`
- **配置入口**：`plugins.row.config`（插件页行配置）不再注册，统一走选择器菜单 →「配置」弹窗
- `dsh.client.inject` 里的静态模块名去掉（那不是包名，属无效声明）
- 新增 `engines.dsh`：`>=0.2.1-rc.2 <0.3.0-0`

## [0.2.0] - 2026-10-28

适配 dsh 0.2（0.2.1-rc.2）：配置系统重写，插件设置改挂到侧边栏「插件」页的行配置。

### Added

- `engines.dsh` 声明（`>=0.2.1-rc.2 <0.3.0-0`），不兼容版本在安装/管理界面直接报出来

### Changed

- **配置持久化**：弃用 `installSettingsSection` / `settingsNamespace` / `ctx.settingsScope`（dsh 0.2 已移除）；改为导出 `Config` schema（`groups` / `selected` 标 `.volatile()`），命名空间 = loader 条目 id `dsh-message-injector`，前端用 `ctx.configForms.get(entryId)` 读写
- **配置入口**：`settings.plugin.item` 槽已不存在；配置卡改注册到 `plugins.row.config`（keyed，key = `dsh-message-injector#dsh-message-injector`），渲染在侧边栏「插件」→ 本插件 → 行「配置」
- **配置直达**：DOM aria/文案定位改为反射服务 `pluginNavigation.openBundle(包名)`；菜单项文案「设置」→「配置」
- **自动反选**（F6-6）移到前端：订阅配置表单快照，选中组被删除/禁用即写回空 `selected`
- `dsh.client.inject` 由服务名改为官方包名（`@deepseek-ai/dsh-client-ui-primitives`），与 0.2 清单语义一致

### Removed

- 依赖 `@deepseek-ai/dsh-settings`（0.2 不再导出旧辅助函数）
- 旧 DOM 定位工具（`utils/settings.ts` 原实现）

## [0.1.0] - 2026-08-30

首个开源版本。

### Added

- **插件骨架**：双半区结构（host 后端 / client 前端）、`dsh.bundle` 激活、官方安装/卸载脚本（`pnpm install:plugin` / `uninstall:plugin`）
- **预设组管理**：设置 → 插件 → 插件配置 中增删改查、启用/禁用、组排序、组折叠（默认收起）；新增组压栈首位并自动展开/滚动
- **预设选择器**（输入框左下角）：选中/反选、空态提示、与权限选择器同款样式（同主题共变）
- **自动注入**：500ms 轮询、注入守卫（绝不触碰已有内容）、IME 组合保护；每条消息自动注入
- **技能校验**：`/` 开头行视为技能调用，缺失时配置卡 ⚠️ 警告、注入时跳过
- **设置直达**：选择器菜单底部「设置」，一键打开设置面板并展开本插件配置卡（优雅降级）
- **全局持久化**：`$DSH_HOME/settings.yaml`（`message-injector` 命名空间），跨会话/刷新/标签页保持

### Changed

- 配置卡对齐 dsh 官方 UI（可折叠标题栏 + 字段块 + 放弃/保存脚注，全令牌自写），并抽象为通用组件 `ConfigCard`
- 源码结构：`src/host` + `src/client` 按官方 half 分法；前端按 `types/api/services/logic/locales/utils/components` 职责分层；领域类型抽到 `src/shared/types.ts`
- 插件定位：由「技能预设自动填充」更名重构为「消息注入」（技能会话级激活，重复注入浪费 token）

### Fixed

- 缺 `dsh.bundle` 声明导致 `dsh plugin add` 后插件不生效
- `useSyncExternalStore` 裸方法丢失 `this` 导致渲染崩溃
- `ctx.logger` 服务工厂误用（`.info` 静默无效，改用 `console.log`）

### Docs

- 中文文档体系：需求 / 架构 / 使用说明 / 安装 / 开发经验（坑与经验分列）/ 迭代记录
- 英文文档：install / usage / architecture
- README 门面页（中英），含配置存储位置与使用建议

### Security

- 开源前安全审计：全提交历史 + 不可达对象扫描，真实身份匿名化、不可达对象物理清除
- 新增 LICENSE（MIT）、npm `keywords`（dsh / dsh-plugin 等）
