# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

（暂无）

## [0.2.1] - 2026-10-28

修 0.2.0 装上后插件整个不加载的问题，并把配置入口做成自包含弹窗。

### Fixed

- **自动注入失效**：dsh 0.2 的 `sessions.list` 快照已无 `current` 字段，取会话 id 恒为空 → 轮询每轮直接返回。改为从会话作用域槽位的**标准 props**（`SessionStandardProps.sessionId`，由渲染器传给槽位组件）记录 `sessionId`，inject face 的参数作为兜底；并加 `inject skipped: ...` 诊断日志（每类原因只报一次）
- **图标全部自带**：dsh 0.2 把 primitives 图标改名（`IconXxxOutline14/16` → `IconXxxOutlineRegular/Medium`），旧名取到 `undefined` 组件会让槽位渲染崩溃、入口整块消失；本插件改为内联 SVG，只保留 `Menu` 依赖
- **快照引用稳定**：`getSnapshot` 每次新建对象会触发 React「getSnapshot should be cached」并打转，改为底层快照不变时复用同一包装对象
- **加载健壮性**：cordis `inject` 收窄为 `slots` / `locale`；`configForms` / `sessions` / `connection` 改为运行时 `ctx.get` 按需取，服务缺失只降级不阻塞加载
- **配置兜底**：宿主配置表单不可用时（服务缺失或版本差异）自动退回 `localStorage`，界面仍可增删改查
- 去掉 `dsh.client.inject` 里的静态模块名（那不是包名，属于无效声明）

### Added

- **预设管理弹窗改用原生 `<dialog>` + `showModal()`**：居中、遮罩、层级由浏览器 top layer 负责，不再受宿主容器 overflow/transform/z-index 影响（此前自绘 overlay 会被带偏到画面左上角）
- **预设管理弹窗**（`PresetDialog`）：选择器菜单底部「配置」直接弹出，增删改查/排序/启用禁用全在弹窗内；Esc、点遮罩、右上 × 关闭；`createPortal` 挂 body 避免被输入区裁切
- 加载时打印 `[dsh-message-injector] client loaded`、槽位注册成功/5s 未出现提示，便于在浏览器 Console 定位

### Changed

- 插件页 `plugins.row.config` 降级为可选入口（宿主支持才注册），不再是唯一配置入口

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
