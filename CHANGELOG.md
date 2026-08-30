# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

（暂无）

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
