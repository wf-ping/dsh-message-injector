/**
 * dsh-message-injector — 前端（dsh 官方称 Client half）入口（组合根）
 *
 * 配置存 dsh 配置系统（settings 命名空间 = 条目 id），跨入口共享；localStorage 只做兜底与首次迁移。
 * 注入走 input.setDraft。
 * 业务实现按职责拆分：
 *  - components/PresetSelector.tsx     预设选择器（conversation.input.left，F2）+「配置」入口
 *  - components/PresetDialog.tsx       预设管理弹窗（原生 dialog，自包含 CRUD，F1）
 *  - components/PresetConfigCard.tsx   预设组表单（弹窗用）
 *  - components/ConfigCard.tsx         通用配置卡壳（官方样式）
 *  - services/injector.ts              500ms 轮询自动注入（F4）+ 注入守卫（F5）
 *  - logic/index.ts                    领域纯逻辑（归一化/技能行判定）
 *  - locales/index.ts                  词典（zh/en）
 *  - utils/                            配置存储（form）、会话 id（session）、CSS、信号、滚动
 *  - api/skills.ts                     技能目录接口 + 30s TTL 缓存
 *
 * 本文件由 scripts/build.mjs 预构建为 lib/client.js（window.__ModuleLoader__.load 形态），
 * 浏览器端无 TS 编译。
 */
import type { RootCtx } from './types'
import { dict } from './locales'
import { createOneShotSignal } from './utils/signal'
import { keepSelectionValid, scopeOf } from './utils/form'
import { createPresetStore } from './utils/store'
import { currentSessionId, setCurrentSessionId } from './utils/session'
import { fetchKnownSkillNames } from './api/skills'
import { armInjection, startAutoInject } from './services/injector'
import { PresetSelector } from './components/PresetSelector'
import type { PresetConfig } from '../shared/types'

/** 词典命名空间（本插件自有） */
export const NS = 'message-injector'

/** 插件入口只需 slots + locale；sessions / connection 运行时按需取，缺了只降级 */
export const inject = ['slots', 'locale'] as const

/** settings 命名空间 = 本插件在 profile 里的条目 id（bundle.patch.yml 的 insert.id） */
const ENTRY_ID = 'dsh-message-injector'

// 插件页行配置卡（可选）展开信号
const cardExpand = createOneShotSignal()
void cardExpand

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  console.info('[dsh-message-injector] client loaded')
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'message-injector: dictionaries')

    // 配置：宿主配置（dsh settings，跨入口共享）；宿主缺失时退回 localStorage
    const store = createPresetStore()
    const scope = scopeOf(store)

    // settings 服务就绪后接管宿主配置；没装 settings 的部署继续走本地
    ctx.inject?.(['configForms'], (child) => {
      const forms = child.configForms
      if (forms === undefined || typeof forms.get !== 'function') return
      try {
        store.attach(forms.get<PresetConfig>(ENTRY_ID))
        console.info('[dsh-message-injector] 配置已接宿主（settings 命名空间 ' + ENTRY_ID + '）')
      } catch (e) {
        console.warn('[dsh-message-injector] 接管宿主配置失败，退回 localStorage:', e)
      }
    })

    // F6-6 自动反选：当前选中组被删除/禁用 → 清空选中
    ctx.effect(() => keepSelectionValid(store), 'message-injector: selection validity')

    // 技能目录（有会话时；无会话返回 null = 不校验）
    const knownSkillNames = () => {
      const id = currentSessionId()
      if (!id) return Promise.resolve(null)
      return fetchKnownSkillNames(ctx, id)
    }

    // F2 预设选择器：输入框左下角官方座位（conversation.input.left）
    ctx.slots.inject('conversation.input.left', () => {
      console.info('[dsh-message-injector] selector registered into conversation.input.left')
      return ctx.slots.register({
        name: 'conversation.input.left',
        id: 'message-injector-preset-selector',
        order: 100,
        locale: NS,
        inject: () => ({
          scope,
          fetchKnownSkillNames: knownSkillNames,
          onSession: (id: string) => setCurrentSessionId(id),
          onSelect: () => armInjection(),
        }),
      }, PresetSelector)
    })

    // F4/F5 自动注入轮询（500ms）
    ctx.effect(() => startAutoInject(ctx, scope, currentSessionId), 'message-injector: auto-inject polling')
  } catch (e) {
    console.error('[dsh-message-injector] client apply FAILED:', e)
    throw e
  }
}
