/**
 * 当前会话 id（模块级共享）
 *
 * 会话 id 只能从会话作用域槽位的标准 props 拿到（dsh 0.2 的 sessions.list 快照无 current）。
 * 放在模块级而不是 apply 闭包里：插件热重载会重建实例，闭包状态会丢，
 * 而模块单例在两个实例之间共享，轮询永远能读到最新值。
 */
let current: string | undefined

/** 记录当前会话 id */
export function setCurrentSessionId(id: string | undefined): void {
  if (typeof id === 'string' && id !== '') current = id
}

/** 读取当前会话 id */
export function currentSessionId(): string | undefined {
  return current
}
