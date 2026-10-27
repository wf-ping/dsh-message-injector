/**
 * 配置存储：浏览器 localStorage（模块级单例）
 *
 * 只承担两个角色（正式存储见 utils/store.ts 的宿主配置）：
 *   1. 兜底——宿主没提供 configForms 时照旧可用；
 *   2. 迁移源 + 镜像——把升级前的本地预设并进宿主，之后每次宿主值变化镜像一份。
 * 模块级单例保证插件热重载后仍是同一份数据。
 */
import type { ConfigFormLike, ConfigSnapshot, ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'

const LOCAL_KEY = 'dsh-message-injector:config'

/** 收敛任意输入为合法 PresetConfig */
export function normalize(rawConfig: unknown): PresetConfig {
  const source = (rawConfig ?? {}) as { groups?: unknown; selected?: unknown }
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

/** 读本地配置（损坏则给空配置） */
export function readLocalConfig(): PresetConfig {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCAL_KEY)
    return normalize(raw === null ? undefined : JSON.parse(raw))
  } catch {
    return { groups: [], selected: '' }
  }
}

/** 写本地配置（镜像；存储不可用时静默失败） */
export function writeLocalConfig(config: PresetConfig): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCAL_KEY, JSON.stringify(config))
  } catch {
    // 存储不可用：内存里仍然生效，只是不持久化
  }
}

/** 内存 + localStorage 的配置表单（与 ConfigFormLike 同形） */
function createLocalForm(): ConfigFormLike<PresetConfig> {
  const listeners = new Set<() => void>()
  let cache = readLocalConfig()
  let snapshot: ConfigSnapshot<PresetConfig> = { status: 'ready', value: cache, writable: true, revision: 0 }
  const emit = () => {
    snapshot = { status: 'ready', value: cache, writable: true, revision: (snapshot.revision ?? 0) + 1 }
    for (const listener of listeners) listener()
  }

  // 其它标签页改了同一份数据 → 同步
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== null && event.key !== LOCAL_KEY) return
      cache = readLocalConfig()
      emit()
    })
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mutate: async (ops) => {
      let next: Record<string, unknown> = { ...cache }
      for (const op of ops) {
        if (op.path.length !== 1) continue
        const field = op.path[0]
        if (op.op === 'unset') delete next[field]
        else next = { ...next, [field]: op.value }
      }
      cache = normalize(next)
      writeLocalConfig(cache)
      emit()
      return true
    },
  }
}

/** 模块级单例（插件重载不丢） */
export const localForm = createLocalForm()

/**
 * 把表单适配成组件用的 ScopeLike。
 * @param form 配置表单
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
      if (!accepted) throw new Error('写入被拒绝')
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
