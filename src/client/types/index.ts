/**
 * types（类型定义目录）
 *
 * 存放跨模块流转的"形状"定义：防御式服务类型（ConfigFormLike/ScopeLike/InputLike/RootCtx 等）。
 * 运行时按需取用，避免对 dsh 内部包（cordis 等）的强类型依赖——只声明实际用到的成员，
 * dsh 升级改内部结构时此处可独立调整。
 *
 * 领域数据对象（PresetGroup/PresetConfig）的唯一来源在 src/shared/types.ts（跨端共用），
 * 需要时从 `../../shared/types` 导入，不在本目录重复定义。
 */
import type { PresetConfig } from '../../shared/types'

/** dsh 0.2 配置表单快照（ConfigFormSnapshot 的防御式形状） */
export interface ConfigSnapshot<T> {
  status: 'loading' | 'ready' | 'unavailable'
  value?: T
  writable?: boolean
  revision?: number
}

/** 一条路径写入操作（SettingsPathOpView 的防御式形状） */
export type ConfigPathOp = { op: 'set'; path: readonly string[]; value: unknown } | { op: 'unset'; path: readonly string[] }

/** 配置表单形状（本插件由 localStorage 实现，接口与 dsh 0.2 的 ConfigForm 同形） */
export interface ConfigFormLike<T> {
  getSnapshot(): ConfigSnapshot<T>
  subscribe(listener: () => void): () => void
  mutate(ops: readonly ConfigPathOp[], expectedRevision?: number): Promise<boolean>
}

/**
 * 组件使用的配置作用域（适配器形状）：getSnapshot/subscribe 直通表单，
 * set(field, value) 收敛为一次 mutate，写被拒时抛错（供配置卡显示失败）。
 */
export interface ScopeLike<T> {
  getSnapshot(): { status: string; value?: T }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

/** 输入框官方写入通道（conversation.input.for(actx) 的防御式形状） */
export interface InputLike {
  setDraft(text: string): void
  state: {
    getSnapshot(): { draft: string; phase: string }
    subscribe?(listener: () => void): () => void
  }
}

/** 客户端根上下文（apply 入参的防御式形状） */
export interface RootCtx {
  effect(fn: () => void | (() => void), label?: string): void
  slots: {
    inject(key: string, cb: () => unknown): () => void
    register(opts: Record<string, unknown>, comp: unknown): () => void
  }
  locale: { register(ns: string, dict: Record<string, Record<string, string>>): void }
  sessions: {
    list: { getSnapshot(): { current?: string } }
    scope(id: string): { get(name: string): unknown } | undefined
  }
  /** 反射层：读取无注入依赖的跨插件服务 */
  reflect: { get(name: string): unknown }
  connection: {
    api: {
      skills: {
        list(req: { sessionId: string }, signal?: AbortSignal): Promise<{ value?: { skills?: { name: string }[] } }>
      }
    }
  }
  get(name: string): unknown
}

/** 绑定后的配置作用域（供组件 props 引用，避免到处 import type） */
export type PresetScope = ScopeLike<PresetConfig>
