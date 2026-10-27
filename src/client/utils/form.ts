/**
 * 配置存储：优先用 dsh 0.2 的配置表单（ctx.configForms），拿不到就退回浏览器本地存储。
 *
 * 本地存储的作用是「插件能装、能改」——配置表单服务缺失（未组合、版本差异、宿主拒绝）
 * 时，预设组仍然可增删改查，并持久化在 localStorage（同浏览器跨标签页同步）。
 */
import type { ConfigFormLike, ConfigSnapshot, RootCtx, ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'

/** 配置表单服务（ConfigForms）的防御式形状 */
interface ConfigFormsLike {
  get<T>(entryId: string): ConfigFormLike<T>
  whileServed?(namespaces: readonly string[], register: (served: ReadonlySet<string>) => () => void): () => void
}

/**
 * 取宿主的配置表单服务（不写进 cordis inject，避免服务缺失时插件整个不加载）。
 * @param ctx 客户端根上下文
 * @returns 服务实例，或 undefined
 */
export function configFormsOf(ctx: RootCtx): ConfigFormsLike | undefined {
  try {
    const fromGet = ctx.get('configForms') as ConfigFormsLike | undefined
    if (fromGet && typeof fromGet.get === 'function') return fromGet
    const fromReflect = ctx.reflect?.get('configForms') as ConfigFormsLike | undefined
    if (fromReflect && typeof fromReflect.get === 'function') return fromReflect
  } catch {
    // 忽略：退回本地存储
  }
  return undefined
}

/** localStorage 键 */
const LOCAL_KEY = 'dsh-message-injector:config'

/** 本地存储表单（与 ConfigFormLike 同形，便于上层零分支） */
function createLocalForm(): ConfigFormLike<PresetConfig> {
  const listeners = new Set<() => void>()
  let cache = read()
  const emit = () => { for (const listener of listeners) listener() }

  // 其它标签页改了同一份数据 → 同步
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== LOCAL_KEY) return
      cache = read()
      emit()
    })
  }

  return {
    getSnapshot: (): ConfigSnapshot<PresetConfig> => ({
      status: 'ready',
      value: cache,
      writable: true,
      revision: 0,
    }),
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mutate: async (ops) => {
      let next: unknown = cache
      for (const op of ops) {
        if (op.path.length !== 1) continue
        const field = op.path[0]
        if (op.op === 'unset') next = { ...(next as Record<string, unknown>) }
        else next = { ...(next as Record<string, unknown>), [field]: op.value }
      }
      cache = normalize(next)
      write(cache)
      emit()
      return true
    },
  }
}

/** 读本地配置（损坏则给空配置） */
function read(): PresetConfig {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCAL_KEY)
    return normalize(raw === null ? undefined : JSON.parse(raw))
  } catch {
    return { groups: [], selected: '' }
  }
}

/** 写本地配置 */
function write(config: PresetConfig): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCAL_KEY, JSON.stringify(config))
  } catch {
    // 存储不可用：内存里仍然生效，只是不持久化
  }
}

/** 收敛任意输入为合法 PresetConfig */
function normalize(value: unknown): PresetConfig {
  const source = (value ?? {}) as { groups?: unknown; selected?: unknown }
  const groups = Array.isArray(source.groups)
    ? source.groups.flatMap((item) => {
      const group = (item ?? {}) as { name?: unknown; description?: unknown; content?: unknown; enabled?: unknown }
      if (typeof group.name !== 'string') return []
      return [{
        name: group.name,
        description: typeof group.description === 'string' ? group.description : '',
        content: Array.isArray(group.content) ? group.content.filter((line): line is string => typeof line === 'string') : [],
        enabled: group.enabled !== false,
      }]
    })
    : []
  return { groups, selected: typeof source.selected === 'string' ? source.selected : '' }
}

/**
 * 选一条可用的配置通道。
 * @param ctx 客户端根上下文
 * @returns 表单（宿主表单或本地存储表单）与来源标记
 */
export function pickForm(ctx: RootCtx): { form: ConfigFormLike<PresetConfig>; remote: boolean; forms?: ConfigFormsLike } {
  const forms = configFormsOf(ctx)
  if (forms) {
    try {
      return { form: forms.get<PresetConfig>('dsh-message-injector'), remote: true, forms }
    } catch {
      // 落回本地存储
    }
  }
  return { form: createLocalForm(), remote: false }
}

/**
 * 把 ConfigForm 适配成组件用的 ScopeLike。
 * @param form 宿主配置表单（命名空间 = loader 条目 id）
 * @returns 组件作用域
 */
export function scopeOf<T>(form: ConfigFormLike<T>): ScopeLike<T> {
  // useSyncExternalStore 要求 getSnapshot 返回稳定引用：底层快照不变就复用同一个包装对象
  let lastRaw: ConfigSnapshot<T> | undefined
  let lastWrapped: { status: string; value?: T } | undefined
  return {
    getSnapshot: () => {
      const snap = form.getSnapshot()
      if (snap !== lastRaw || lastWrapped === undefined) {
        lastRaw = snap
        lastWrapped = { status: snap.status, value: snap.value }
      }
      return lastWrapped
    },
    subscribe: (listener: () => void) => form.subscribe(listener),
    set: async (field: string, value: unknown) => {
      const accepted = await form.mutate([{ op: 'set', path: [field], value }])
      if (!accepted) throw new Error('宿主拒绝了这次写入（配置可能已被其他窗口修改）')
    },
  }
}

/**
 * 当前选中组被删除或禁用时清空 selected（F6-6）。
 * @param form 配置表单
 * @returns 停止监听的函数
 */
export function keepSelectionValid<T extends { selected: string; groups: { name: string; enabled: boolean }[] }>(
  form: ConfigFormLike<T>,
): () => void {
  const check = () => {
    const snap = form.getSnapshot()
    const config = snap.value
    if (snap.status !== 'ready' || !config || config.selected === '') return
    const target = config.groups.find((group) => group.name === config.selected)
    if (target && target.enabled) return
    void form.mutate([{ op: 'set', path: ['selected'], value: '' }]).catch(() => {})
  }
  check()
  return form.subscribe(check)
}
