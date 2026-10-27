/**
 * dsh-message-injector — 前端（dsh 官方称 Client half）入口（组合根）
 *
 * 职责：接线 —— 词典注册、配置通道选择、选择器槽位、可选插件页卡片、自动注入轮询。
 * 业务实现按职责拆分：
 *  - components/PresetSelector.tsx     预设选择器（conversation.input.left，F2）+ 「配置」入口
 *  - components/PresetDialog.tsx       预设管理弹窗（自包含 CRUD，不依赖 dsh 设置面板，F1）
 *  - components/PresetConfigCard.tsx   预设组表单（弹窗 / 插件页行配置共用）
 *  - components/ConfigCard.tsx         通用配置卡壳（官方样式，可复用）
 *  - services/injector.ts              500ms 轮询自动注入（F4）+ 注入守卫（F5）
 *  - logic/index.ts                    领域纯逻辑（归一化/技能行判定）
 *  - locales/index.ts                  词典（zh/en）
 *  - utils/                            配置通道（form）、插件页导航（settings）、
 *                                      滚动（scroll）、CSS 注入（css）、一次性信号（signal）
 *  - api/skills.ts                     技能目录接口 + 30s TTL 缓存
 *
 * 本文件由 scripts/build.mjs 预构建为 lib/client.js（window.__ModuleLoader__.load 形态），
 * 浏览器端无 TS 编译。
 *
 * 加载健壮性：cordis inject 只声明必需且有把握的服务（slots/locale）；
 * configForms / sessions / connection 一律运行时按需取，缺了就降级，绝不让插件整个不加载。
 */
import type { RootCtx } from './types'
import type { PresetConfig } from '../shared/types'
import { dict } from './locales'
import { createOneShotSignal } from './utils/signal'
import { openPluginPage } from './utils/settings'
import { keepSelectionValid, pickForm, scopeOf } from './utils/form'
import { fetchKnownSkillNames } from './api/skills'
import { startAutoInject } from './services/injector'
import { PresetSelector } from './components/PresetSelector'
import { PresetConfigCard } from './components/PresetConfigCard'

/** 词典命名空间（本插件自有，与配置条目无关） */
export const NS = 'message-injector'

/** 配置命名空间 = loader 条目 id，由本包 bundle.patch.yml 声明（id: dsh-message-injector） */
export const ENTRY_ID = 'dsh-message-injector'

export const inject = ['slots', 'locale'] as const

// 插件页行配置卡（可选）：卡已挂载立即展开；未挂载挂起、挂载即消费
const cardExpand = createOneShotSignal()

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  console.info('[dsh-message-injector] client loaded')
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'message-injector: dictionaries')

    // 配置通道：宿主配置表单（dsh settings）优先，拿不到则本地存储（本次会话内可增删改查）
    const picked = pickForm(ctx)
    const scope = scopeOf(picked.form)
    if (!picked.remote) {
      console.warn('[dsh-message-injector] configForms 不可用，配置暂存浏览器本地（localStorage）')
    }

    // F6-6 自动反选：当前选中组被删除/禁用 → 清空选中
    ctx.effect(() => keepSelectionValid(picked.form), 'message-injector: selection validity')

    // 当前会话 id：由会话作用域槽位的 inject face 提供（dsh 0.2 的 sessions.list 快照无 current）
    let sessionId: string | undefined
    const currentSessionId = () => sessionId

    // 技能目录（有会话时；无会话返回 null = 不校验）
    const knownSkillNames = () => {
      if (!sessionId) return Promise.resolve(null)
      return fetchKnownSkillNames(ctx, sessionId)
    }

    // F2 预设选择器：输入框左下角官方座位（conversation.input.left，additive list 槽）
    // 菜单底部「配置」打开自带的 PresetDialog（自包含增删改查）
    let selectorRegistered = false
    ctx.slots.inject('conversation.input.left', () => {
      selectorRegistered = true
      console.info('[dsh-message-injector] selector registered into conversation.input.left')
      return ctx.slots.register({
        name: 'conversation.input.left',
        id: 'message-injector-preset-selector',
        order: 100,
        locale: NS,
        inject: () => ({
          scope,
          fetchKnownSkillNames: knownSkillNames,
          onOpenSettings: () => openPluginPage(ctx, ENTRY_ID),
        }),
      }, PresetSelector)
    })
    // 5 秒内槽位没出现 → 提示（输入框左下角没有入口时先看这条）
    if (typeof setTimeout === 'function') {
      setTimeout(() => {
        if (!selectorRegistered) {
          console.warn('[dsh-message-injector] conversation.input.left 槽位 5s 内未出现，选择器未注册')
        }
      }, 5000)
    }

    // F1（可选）插件页行配置：宿主服务该命名空间且提供配置表单服务时才注册，
    // 未组合插件页 / 无表单服务时不产生任何残留 UI。
    const forms = picked.forms
    if (forms?.whileServed) {
      ctx.effect(() => forms.whileServed!([ENTRY_ID], () =>
        ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
          name: 'plugins.row.config',
          key: `${ENTRY_ID}#${ENTRY_ID}`,
          locale: NS,
          inject: () => ({
            scope,
            expandSignal: cardExpand,
            fetchKnownSkillNames: knownSkillNames,
          }),
        }, PresetConfigCard))), 'message-injector: config page')
    }

    // F4/F5 自动注入轮询（500ms，用户拍板的实现方案）
    ctx.effect(() => startAutoInject(ctx, scope, currentSessionId), 'message-injector: auto-inject polling')
  } catch (e) {
    console.error('[dsh-message-injector] client apply FAILED:', e)
    throw e
  }
}
