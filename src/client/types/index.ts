/**
 * types（类型定义目录）
 *
 * 存放跨模块流转的"形状"定义：防御式服务类型（ScopeLike/InputLike/RootCtx 等）。
 * 运行时按需取用，避免对 dsh 内部包（cordis 等）的强类型依赖——只声明实际用到的成员，
 * dsh 升级改内部结构时此处可独立调整。
 *
 * 领域数据对象（PresetGroup/PresetConfig）的唯一来源在 src/shared/types.ts（跨端共用），
 * 需要时从 `../../shared/types` 导入，不在本目录重复定义。
 */
import type { PresetConfig } from '../../shared/types'

/** settings 配置作用域（SettingsScope 的防御式形状） */
export interface ScopeLike<T> {
  getSnapshot(): { status: string; value?: T }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

/** 输入框官方写入通道（conversation.input.for(actx) 的防御式形状） */
export interface InputLike {
  setDraft(text: string): void
  state: { getSnapshot(): { draft: string; phase: string } }
}

/** 客户端根上下文（apply 入参的防御式形状） */
export interface RootCtx {
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
