/**
 * 配置存储：宿主配置优先，localStorage 兜底
 *
 * 宿主配置 = dsh 的 settings 命名空间（条目 id `dsh-message-injector`），
 * 落盘在当前 profile 的 cordis.patch.yml，终端 `dsh web` 与 VS Code 面板共用。
 * localStorage 只作两件事：
 *   1. 兜底——宿主没有该命名空间（老版本 dsh / 未挂 settings）时照旧可用；
 *   2. 镜像 + 一次性迁移——把升级前存在浏览器里的预设搬到宿主，两边数据都不丢。
 *
 * 对上层（选择器 / 注入服务）暴露稳定的 ConfigFormLike，内部换后端不影响订阅者。
 */
import type { ConfigFormLike, ConfigSnapshot } from '../types'
import type { PresetConfig } from '../../shared/types'
import { localForm, normalize, readLocalConfig, writeLocalConfig } from './form'
import { mergePresetConfig } from '../logic'

/** 迁移完成标记（按 origin 记，避免每次启动重复合并） */
const MIGRATED_KEY = 'dsh-message-injector:migrated-v1'
/** 存储后端：宿主配置优先，缺失时退回 localStorage */
export type StoreMode = 'host' | 'local'

function alreadyMigrated(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATED_KEY) === '1'
  } catch {
    return false
  }
}

function markMigrated(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(MIGRATED_KEY, '1')
  } catch {
    // 标记写不进去就下次再合并一遍，合并是幂等的
  }
}

/** 稳定的配置表单：后端可替换，订阅者不必重挂 */
export interface PresetStore extends ConfigFormLike<PresetConfig> {
  /** 接管宿主配置表单（由 ctx.configForms.get 提供） */
  attach(remote: ConfigFormLike<PresetConfig>): void
  /** 当前后端（排查用） */
  mode(): StoreMode
}

/**
 * 把宿主表单包一层：值先归一化（防脏数据），快照按底层引用缓存，
 * 写入失败（含传输异常）一律返回 false 而不是抛给 UI。
 */
function adaptRemote(remote: ConfigFormLike<PresetConfig>): ConfigFormLike<PresetConfig> {
  let lastRaw: ConfigSnapshot<PresetConfig> | undefined
  let lastView: ConfigSnapshot<PresetConfig> = { status: 'loading' }
  return {
    getSnapshot() {
      const raw = remote.getSnapshot()
      if (raw !== lastRaw) {
        lastRaw = raw
        lastView = {
          status: raw.status,
          value: raw.value === undefined ? undefined : normalize(raw.value),
          writable: raw.writable,
          revision: raw.revision,
        }
      }
      return lastView
    },
    subscribe: (listener) => remote.subscribe(listener),
    mutate: async (ops, expectedRevision) => {
      try {
        return await remote.mutate(ops, expectedRevision)
      } catch (error) {
        console.warn('[dsh-message-injector] 宿主配置写入失败，沿用当前值', error)
        return false
      }
    },
  }
}

/** 创建配置存储（模块级单例，热重载不丢） */
export function createPresetStore(): PresetStore {
  const listeners = new Set<() => void>()
  let backend: ConfigFormLike<PresetConfig> = localForm
  let detach: (() => void) | undefined
  let mode: StoreMode = 'local'
  let migrating = false
  let migrated = alreadyMigrated()

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const useBackend = (next: ConfigFormLike<PresetConfig>, nextMode: StoreMode) => {
    detach?.()
    backend = next
    mode = nextMode
    detach = next.subscribe(emit)
    emit()
  }

  /** 首次接管宿主配置：把旧 localStorage 里的预设并进宿主（幂等，成功后打标记） */
  const migrate = async (remote: ConfigFormLike<PresetConfig>) => {
    if (migrated || migrating) return
    const snapshot = remote.getSnapshot()
    if (snapshot.status !== 'ready' || snapshot.value === undefined) return
    migrating = true
    const local = readLocalConfig()
    const host = snapshot.value
    if (local.groups.length === 0 && local.selected === '') {
      writeLocalConfig(host)
      migrated = true
      markMigrated()
      migrating = false
      return
    }
    const merged = mergePresetConfig(local, host)
    const changed = JSON.stringify(merged) !== JSON.stringify(host)
    const accepted = changed
      ? await remote.mutate([
        { op: 'set', path: ['groups'], value: merged.groups },
        { op: 'set', path: ['selected'], value: merged.selected },
      ])
      : true
    migrating = false
    if (!accepted) return // 宿主拒写：不打标记，下次再试
    writeLocalConfig(merged)
    migrated = true
    markMigrated()
  }

  useBackend(localForm, 'local')

  return {
    mode: () => mode,
    getSnapshot: () => backend.getSnapshot(),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mutate: async (ops, expectedRevision) => backend.mutate(ops, expectedRevision),
    attach: (remoteForm) => {
      if (mode === 'host') return
      const remote = adaptRemote(remoteForm)
      const check = () => {
        const snapshot = remote.getSnapshot()
        // 宿主没提供命名空间（老版本 dsh / 未挂 settings）：继续用 localStorage
        if (snapshot.status === 'unavailable') return
        if (snapshot.status !== 'ready' || snapshot.value === undefined) return
        // 迁移完成前不镜像：镜像会先把本地旧数据冲掉，迁移就丢了源
        if (migrated) writeLocalConfig(snapshot.value)
        if (mode !== 'host') useBackend(remote, 'host')
        void migrate(remote)
      }
      remote.subscribe(check)
      check()
    },
  }
}
