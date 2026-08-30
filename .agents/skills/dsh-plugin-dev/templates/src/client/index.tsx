/**
 * dsh 插件前端最小骨架（槽位组件 + settingsScope 读取）
 *
 * 完整功能参考：dsh-message-injector 仓库的 src/client/index.tsx——
 *  - 500ms 轮询注入、注入守卫、技能存在性校验、词典（zh/en）
 *
 * 数据读取两条路（开发前先按 SKILL.md 步骤 1 确认 harness 版本与基线支持面）：
 *  A. 基线就绪（harness 模块表含 @deepseek-ai/dsh-client-store）——官方家规：
 *     createSnapshotStore + inject face 的 hooks 口子，渲染器绑成 use<Name>() 钩子，
 *     业务组件零手写订阅。参考 官方对照.md #7。
 *  B. 基线未发布（当前 0.1.1-rc.2）——下方写法：settingsScope 裸数据源 +
 *     useSyncExternalStore，必须箭头函数包裹（坑 7：裸传方法丢 this，渲染崩溃）。
 */
import { useSyncExternalStore } from 'react'

// ─── 防御式服务类型（运行时按需取用，避免对内部包的强类型依赖）────────────
interface ScopeLike<T> {
  getSnapshot(): { status: string; value?: T }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

interface RootCtx {
  effect(fn: () => void | (() => void), label?: string): void
  slots: {
    inject(key: string, cb: () => unknown): void
    register(opts: Record<string, unknown>, comp: unknown): () => void
  }
  locale: { register(ns: string, dict: Record<string, Record<string, string>>): void }
  sessions: {
    list: { getSnapshot(): { current?: string } }
    scope(id: string): { get(name: string): unknown } | undefined
  }
  settingsScope: { bind<T>(spec: { namespace: string }): ScopeLike<T> }
  get(name: string): unknown
}

export const NS = 'hello'

export const inject = ['slots', 'locale', 'sessions', 'settingsScope', 'connection'] as const

// ─── 词典（zh/en）──────────────────────────────────────────────────────
const dict: Record<string, Record<string, string>> = {
  zh: { count: '计数', desc: '示例配置卡', save: '保存', discard: '放弃' },
  en: { count: 'Count', desc: 'Example config card', save: 'Save', discard: 'Discard' },
}

// ─── 组件：设置 → 插件 → 插件配置 卡（settings.plugin.item 槽）──────────
// 通用配置卡壳（官方样式 + 折叠标题栏 + 放弃/保存脚注）来自 components/ConfigCard.tsx；
// 字段样式类（psi-field / psi-head / psi-label / psi-hint 等）随 ConfigCard 一并注入
import { ConfigCard } from './components/ConfigCard'

function HelloCard({ scope, t }: { scope: ScopeLike<{ count: number }>; t: (key: string) => string }) {
  // 坑 7：必须用箭头函数包一层，否则 useSyncExternalStore 调用时丢失 this
  const snap = useSyncExternalStore(
    (listener: () => void) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const count = snap.status === 'ready' ? snap.value?.count ?? 0 : 0
  return (
    <ConfigCard
      title="Hello"
      description={t('desc')}
      dirty={false}
      saving={false}
      onSave={() => {}}
      onDiscard={() => {}}
      labels={{ save: t('save'), discard: t('discard') }}
    >
      <div className="psi-field">
        <div className="psi-head">
          <span className="psi-label">{t('count')}</span>
        </div>
        <p className="psi-hint">{count}</p>
      </div>
    </ConfigCard>
  )
}

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'hello: dictionaries')

    const scope = ctx.settingsScope.bind<{ count: number }>({ namespace: NS })

    // 配置卡：设置 → 插件 → 插件配置（key 必须等于后端注册的命名空间）
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: NS,
      locale: NS,
      inject: () => ({ scope }),
    }, HelloCard))

    // 写数据一律 scope.set（经后端 schema 校验与持久化）：
    // void scope.set('count', count + 1)
  } catch (e) {
    console.error('[dsh-hello-plugin] client apply FAILED:', e)
    throw e
  }
}
