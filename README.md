# dsh-skill-injector

dsh（DeepSeek Harness）插件：预设常用 skill 组合，选中后自动填充到输入框首行，一键启用、切换、停止，无需每次对话前手动输入 `/grill-me` 之类的技能指令。

完整需求：`docs/需求/全局.md`（含术语表 `CONTEXT.md`）。

## 功能一览

| 需求 | 实现 |
|---|---|
| F1 预设组管理 | 设置 → 插件 → 插件配置：增删改查、启用/禁用、技能排序（↑↓）、组名唯一/非空组硬校验 |
| F2 预设选择器 | 输入框工具栏 FULL ACCESS 按钮之后的官方槽位（`conversation.input.left`），样式复用同一套 `--dsw-alias-*` 令牌，随主题共变 |
| F3 选择状态 | 全局持久化（settings 命名空间 `skill-injector`，存于 `$DSH_HOME/settings.yaml`，跨会话/刷新/标签页）；当前组被删除/禁用自动反选 |
| F4 自动填充 | 500ms 轮询；选中组后空输入框自动填入技能文本（一行、空格分隔，如 `/grill-me /domain-modeling `） |
| F5 填充守卫 | 输入框去掉空白后非空 → 不填充，绝不触碰已有内容 |
| F6 校验边界 | 保存时硬校验（Host `validate`）；技能缺失警告标记（⚠️）+ 填充时跳过缺失项；全禁用空态提示 |

## 架构（双半区插件）

```
dsh-skill-injector/
├── package.json            # dsh.client 声明 + exports["./client"] 指向构建产物
├── src/
│   ├── index.ts            # Host 半区（Node 26 原生跑 TS）：Config schema + settings 接线 + validate
│   ├── client.tsx          # 客户端半区源码（JSX；构建为 lib/client.js）
│   └── ambient.d.ts        # 最小类型桩（react / primitives 由浏览器运行时提供）
├── scripts/build.mjs       # esbuild 构建：src/client.tsx → lib/client.js（__ModuleLoader__.load 形态）
├── lib/client.js           # 构建产物（已提交；改动客户端代码后需重新 pnpm build）
└── docs/需求/全局.md        # 需求定义
```

> 仓库**不包含** `cordis.yml` / `--patch` 本地加载配置。插件统一走官方 `dsh plugin add/remove` 安装（见下）。

关键机制（研究结论，开发时已核实）：

- **UI 注入**：`ctx.slots.inject('conversation.input.left', ...)` 注册列表槽组件（输入工具栏 FULL ACCESS 之后的官方座位）；配置卡走 `settings.plugin.item`（key = 命名空间 `skill-injector`）
- **输入读写**：官方通道 `input.setDraft(text)`（`conversation.input.for(actx)`，React 受控组件，禁止直接改 DOM）；判空读 `input.state.getSnapshot()`（draft/phase）
- **配置持久化**：Host `installSettingsSection` 注册命名空间；客户端 `ctx.settingsScope.bind({namespace})` 读写（跨标签页同步）
- **技能目录**：`connection.api.skills.list({sessionId})`（必须带会话；无会话时校验不可用 → 填充按配置原样执行）

## 构建

```bash
pnpm install          # 安装依赖（schemastery / dsh-settings / esbuild / typescript）
pnpm build            # 构建客户端半区 → lib/client.js（dsh HMR 监视该文件，改后重构建即热更）
pnpm typecheck        # tsc --noEmit 类型检查
```

> 本插件是**第一个外部调用 `setDraft` 输入写入通道的插件**（dsh 源码中无先例），该通道虽为官方公开 API，但建议测试时重点验证填充行为。

## 安装与测试（官方路径，由用户亲自执行）

开发红线（见 `CLAUDE.md`）：只允许在项目内改代码；不自启动 dsh 服务；测试仅用官方安装/卸载方式。

**安装（成品已含在仓库里，无需先 build）：**

```bash
dsh plugin --profile web add <本仓库路径>            # 安装
dsh plugin --profile web remove dsh-skill-injector   # 卸载
```

> `pnpm build` 不是安装，而是"打包"：把浏览器界面源码（`src/client.tsx`）翻译成 dsh 能读取的 `lib/client.js`。该产物已提交在仓库中，**直接安装即可**；只有改动过 `src/client.tsx` 界面代码后，才需要先 `pnpm build` 再重新 `dsh plugin add`。
> 仓库不提供 `--patch` 本地加载配置（避免在仓库内维护含绝对路径的 `cordis.yml`）。

## 使用说明

1. 设置 → 插件 → 插件配置 → 找到 dsh-skill-injector 卡片 → 添加预设组（如名称 `grill`，技能每行一个：`grill-me`、`domain-modeling`）→ 保存
2. 回到对话，输入框工具栏 FULL ACCESS 按钮旁出现「预设」按钮 → 点击 → 选择刚保存的组
3. 空输入框会在 ~500ms 内自动填入 `/grill-me /domain-modeling `，直接输入内容发送即可；每条消息自动带技能
4. 输入框已有内容时不填充（保护已有内容）；再次点击当前选中项 = 反选，停止自动填充

## 验收清单（对应需求 §8）

- [ ] 配置卡可完成预设组增删改查、启用/禁用、技能排序；空组/重名被拒绝
- [ ] 启用的组出现在选择器菜单；禁用的不出现
- [ ] 未选中任何组 → 不填充
- [ ] 选中后空输入框 ~500ms 内填充到首行；多技能为一行空格分隔
- [ ] 输入框有内容 → 不填充、不修改已有内容
- [ ] 反选后不再填充；刷新页面、重启后选择状态保持
- [ ] 当前选中组被删除/禁用后自动反选
- [ ] 主题/皮肤插件改变 FULL ACCESS 外观时，选择器同步变化
- [ ] 技能缺失的组：配置卡显示 ⚠️；填充时缺失项被跳过；全部缺失时不填充

## 已知边界（测试时可关注）

- 手动清空输入框后 ~500ms 内技能会被重新填入——这是设计行为（发纯文本请反选），不是 bug
- 技能缺失标记依赖当前会话（`api.skills.list` 必须带 sessionId）；无会话时配置卡不显示 ⚠️，保存仍由 Host 校验
- 中文输入法组合期间、消息提交中不填充（守卫）
