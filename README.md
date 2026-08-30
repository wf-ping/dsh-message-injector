# dsh-message-injector

> English: [README_EN.md](README_EN.md)

dsh（DeepSeek Harness）插件：预设常用"消息注入内容"组合（任意文本 / 技能调用），**每条消息自动注入**到输入框首行，一键启用、切换、停止——不需要每条消息手动输入固定的指令前缀或格式要求。

## 功能

- **预设组管理**：设置 → 插件 → 插件配置 中增删改查、启用/禁用、内容排序
- **一键选择**：输入框左下角的「预设」选择器，点击选中，再点反选
- **自动注入**：空输入框 ~500ms 自动注入内容（如 `/grill-me /domain-modeling ` 或 "请用中文回答"）
- **技能校验**：以 `/` 开头的内容视为技能调用，缺失时配置卡警告、注入时跳过
- **智能守卫**：输入框已有内容时不注入，绝不打扰已有内容
- **全局持久化**：选择状态跨会话、刷新、标签页保持

## 快速安装

```bash
dsh plugin --profile web add github:用户名/仓库名    # 从 GitHub 安装
dsh plugin --profile web add <本仓库路径>           # 本地/开发时安装
```

> 首次安装均无需构建（`lib/` 产物已提交）。详见[安装文档](docs/zh/安装.md)。

## 重新构建

改代码后需要重新生成 `lib/` 并重启生效：

```bash
pnpm install      # 安装运行环境
pnpm build        # 生成产物
dsh web           # 启动服务
```

## 更新

**本地路径安装（软链接）** —— 更新 = 改代码 + 重新构建，无需重装：

```bash
pnpm build        # 重新生成 lib/
# 重启 dsh web 生效
```

**GitHub 安装（克隆副本）** —— 已装副本与本地代码无关，更新需重新拉取：

```bash
dsh plugin --profile web add github:用户名/仓库名    # 重新拉取最新版本
# 重启 dsh web 生效
```

> 若重新 add 后仍未更新，先卸载再重装（见[卸载](#卸载)）。

## 卸载

```bash
dsh plugin --profile web remove dsh-message-injector    # 卸载
# 或在仓库目录内：pnpm uninstall:plugin
```

## 文档

- [安装](docs/zh/安装.md)
- [使用说明](docs/zh/使用说明.md)
- [架构](docs/zh/架构.md)

> 开发者：需求文档见 `docs/zh/需求.md`，开发经验（踩坑记录）见 `docs/zh/开发经验.md`，术语表见 `CONTEXT.md`。
