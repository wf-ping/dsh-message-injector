/**
 * 一次性信号（One-shot Signal）
 *
 * 场景：A 处触发、B 处消费——但 B 可能尚未挂载（信号需挂起，挂载时消费）。
 * 典型用法：选择器菜单「设置」→ 配置卡展开（已挂载立即展开；未挂载挂起、
 * 挂载即消费）。形状与 ConfigCard 的 expandSignal prop 兼容。
 */
export interface OneShotSignal {
  /** 触发信号：置为挂起 + 通知所有订阅者 */
  request(): void
  /** 挂载时消费挂起的信号（消费后清除，避免下次误触发） */
  consumePending(): boolean
  /** 订阅实时信号；返回退订函数 */
  subscribe(fn: () => void): () => void
}

export function createOneShotSignal(): OneShotSignal {
  let pending = false
  const listeners = new Set<() => void>()
  return {
    request() {
      pending = true
      for (const fn of listeners) fn()
    },
    consumePending() {
      if (!pending) return false
      pending = false
      return true
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}
