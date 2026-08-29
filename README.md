# dsh-skill-injector

dsh（DeepSeek Harness）插件：预设常用 skill 组合，选中后自动填充到输入框首行，一键启用、切换、停止——无需每次对话前手动输入 `/grill-me`。

## 功能

- **预设组管理**：设置 → 插件 → 插件配置 中增删改查、启用/禁用、技能排序
- **一键选择**：输入框 FULL ACCESS 按钮旁的「预设」选择器，点击选中，再点反选
- **自动填充**：空输入框 ~500ms 自动填入技能文本（如 `/grill-me /domain-modeling `）
- **智能守卫**：输入框已有内容时不填充，绝不打扰已有内容
- **全局持久化**：选择状态跨会话、刷新、标签页保持

## 快速安装

```bash
dsh plugin --profile web add <本仓库路径>
```

> 插件以软链接装入 profile，改代码后只需 `pnpm build` + 重启 dsh，无需重装。详见[安装文档](docs/zh/安装.md)。

## 文档

| | 安装 | 使用 | 架构 |
|---|---|---|---|
| 中文 | [安装](docs/zh/安装.md) | [使用说明](docs/zh/使用说明.md) | [架构](docs/zh/架构.md) |
| English | [Install](docs/en/install.md) | [Usage](docs/en/usage.md) | [Architecture](docs/en/architecture.md) |

> 开发者：需求文档见 `docs/zh/需求.md`，术语表见 `CONTEXT.md`。
