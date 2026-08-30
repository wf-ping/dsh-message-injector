/**
 * dsh-message-injector — 前端（dsh 官方称 Client half）入口（组合根）
 *
 * 职责：接线 —— 词典注册、配置作用域绑定、两个 UI 槽位、设置直达、自动注入轮询。
 * 业务实现按职责拆分：
 *  - components/PresetSelector.tsx     预设选择器（conversation.input.left，F2）
 *  - components/PresetConfigCard.tsx   预设组配置卡（settings.plugin.item，F1）
 *  - components/ConfigCard.tsx         通用配置卡壳（官方样式，可复用）
 *  - injector.ts                       500ms 轮询自动注入（F4）+ 注入守卫（F5）
 *  - domain.ts                         领域纯逻辑（归一化/技能行判定）
 *  - locales.ts                        词典（zh/en）
 *  - utils/                            滚动（scroll）、CSS 注入（css）、一次性信号（signal）、
 *                                      设置面板定位（settings）、技能目录（skills）
 *
 * 本文件由 scripts/build.mjs 预构建为 lib/client.js（window.__ModuleLoader__.load 形态），
 * 浏览器端无 TS 编译。
 */
import type { RootCtx } from './types'
import type { PresetConfig } from '../shared/types'
import { dict } from './locales'
import { createOneShotSignal } from './utils/signal'
import { openSettingsSection } from './utils/settings'
import { fetchKnownSkillNames } from './api/skills'
import { startAutoInject } from './services/injector'
import { PresetSelector } from './components/PresetSelector'
import { PresetConfigCard } from './components/PresetConfigCard'

export const NS = 'message-injector'

export const inject = ['slots', 'locale', 'sessions', 'settingsScope', 'connection'] as const

// ─── 设置直达：选择器菜单「设置」→ 打开设置面板并展开配置卡 ─────────────
// dsh 无公共 API 程序化打开设置（SettingsRoot 的 open/分区均为内部 state），
// 采用官方 aria 属性 + 官方导航文案定位（utils/settings.ts）；展开用一次性信号
// （utils/signal.ts）：已挂载立即展开；未挂载（如分区定位失败）挂起、挂载即消费。
// 全程优雅降级：任一步失败 = 用户手动补一步，不报错。
const cardExpand = createOneShotSignal()

function openSettingsAndExpand() {
  cardExpand.request()
  void openSettingsSection(/插件|Plugins/)
}

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'message-injector: dictionaries')

    // 配置作用域：预设组 + 选中状态共用命名空间（F3 全局持久化）
    const scope = ctx.settingsScope.bind<PresetConfig>({ namespace: NS })

    // F2 预设选择器：输入框左下角官方座位（conversation.input.left，additive list 槽）
    ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
      name: 'conversation.input.left',
      id: 'message-injector-preset-selector',
      order: 100,
      locale: NS,
      inject: () => ({ scope, onOpenSettings: openSettingsAndExpand }),
    }, PresetSelector))

    // F1 配置卡：设置 → 插件 → 插件配置（key 必须等于后端注册的命名空间）
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: NS,
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
    }, PresetConfigCard))

    // F4/F5 自动注入轮询（500ms，用户拍板的实现方案）
    ctx.effect(() => startAutoInject(ctx, scope), 'message-injector: auto-inject polling')
  } catch (e) {
    console.error('[dsh-message-injector] client apply FAILED:', e)
    throw e
  }
}
