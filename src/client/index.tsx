/**
 * dsh-message-injector — 前端（dsh 官方称 Client half）入口（组合根）
 *
 * 职责：接线 —— 词典注册、配置表单绑定、两个 UI 槽位、插件页直达、自动注入轮询。
 * 业务实现按职责拆分：
 *  - components/PresetSelector.tsx     预设选择器（conversation.input.left，F2）
 *  - components/PresetConfigCard.tsx   预设组配置卡（plugins.row.config，F1）
 *  - components/ConfigCard.tsx         通用配置卡壳（官方样式，可复用）
 *  - services/injector.ts              500ms 轮询自动注入（F4）+ 注入守卫（F5）
 *  - logic/index.ts                    领域纯逻辑（归一化/技能行判定）
 *  - locales/index.ts                  词典（zh/en）
 *  - utils/                            作用域适配（form）、插件页导航（settings）、
 *                                      滚动（scroll）、CSS 注入（css）、一次性信号（signal）
 *  - api/skills.ts                     技能目录接口 + 30s TTL 缓存
 *
 * 本文件由 scripts/build.mjs 预构建为 lib/client.js（window.__ModuleLoader__.load 形态），
 * 浏览器端无 TS 编译。
 */
import type { RootCtx } from './types'
import type { PresetConfig } from '../shared/types'
import { dict } from './locales'
import { createOneShotSignal } from './utils/signal'
import { openPluginPage } from './utils/settings'
import { keepSelectionValid, scopeOf } from './utils/form'
import { fetchKnownSkillNames } from './api/skills'
import { startAutoInject } from './services/injector'
import { PresetSelector } from './components/PresetSelector'
import { PresetConfigCard } from './components/PresetConfigCard'

/** 词典命名空间（本插件自有，与配置条目无关） */
export const NS = 'message-injector'

/**
 * 配置命名空间 = loader 条目 id，由本包 bundle.patch.yml 声明（id: dsh-message-injector）。
 * dsh 0.2 的配置表单与持久化都以条目 id 为键：settings 把改动写进 profile 的 patch 层。
 */
export const ENTRY_ID = 'dsh-message-injector'

export const inject = ['slots', 'locale', 'sessions', 'configForms', 'connection'] as const

// ─── 插件页直达：选择器菜单「配置」→ 打开本包的插件页（包 → 行 → 配置）───
// dsh 0.2 的插件配置页在侧边栏「插件」面板（plugins.row.config 槽），
// 通过反射服务 pluginNavigation.openBundle 打开；服务缺失时静默降级。
// 展开用一次性信号（utils/signal.ts）：卡已挂载立即展开；未挂载挂起、挂载即消费。
const cardExpand = createOneShotSignal()

function openPluginConfig(ctx: RootCtx) {
  cardExpand.request()
  openPluginPage(ctx, ENTRY_ID)
}

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'message-injector: dictionaries')

    // 配置表单（F3 全局持久化）：命名空间 = loader 条目 id
    const form = ctx.configForms.get<PresetConfig>(ENTRY_ID)
    const scope = scopeOf(form)

    // F6-6 自动反选：当前选中组被删除/禁用 → 清空选中
    ctx.effect(() => keepSelectionValid(form), 'message-injector: selection validity')

    // F2 预设选择器：输入框左下角官方座位（conversation.input.left，additive list 槽）
    ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
      name: 'conversation.input.left',
      id: 'message-injector-preset-selector',
      order: 100,
      locale: NS,
      inject: () => ({ scope, onOpenSettings: () => openPluginConfig(ctx) }),
    }, PresetSelector))

    // F1 配置卡：插件页 → 本包包页 → 行配置（plugins.row.config，keyed 槽，
    // key = `<包名>#<行 id>`）；宿主服务该命名空间后才注册，未组合插件页时无痕迹。
    ctx.effect(() => ctx.configForms.whileServed([ENTRY_ID], () =>
      ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
        name: 'plugins.row.config',
        key: `${ENTRY_ID}#${ENTRY_ID}`,
        locale: NS,
        inject: () => ({
          scope,
          expandSignal: cardExpand,
          fetchKnownSkillNames: () => {
            const sessionId = ctx.sessions.list.getSnapshot().current
            if (!sessionId) return Promise.resolve(null)
            return fetchKnownSkillNames(ctx, sessionId)
          },
        }),
      }, PresetConfigCard))), 'message-injector: config page')

    // F4/F5 自动注入轮询（500ms，用户拍板的实现方案）
    ctx.effect(() => startAutoInject(ctx, scope), 'message-injector: auto-inject polling')
  } catch (e) {
    console.error('[dsh-message-injector] client apply FAILED:', e)
    throw e
  }
}
