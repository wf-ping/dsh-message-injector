/**
 * 配置表单 → 组件作用域适配器
 *
 * dsh 0.2 的 ctx.configForms.get(entryId) 提供 getSnapshot/subscribe/mutate；
 * 组件的既有契约是 ScopeLike（set(field, value)），这里做一次收敛：
 * 写被宿主拒绝（返回 false）时抛错，让配置卡走既有的失败提示分支。
 */
import type { ConfigFormLike, ScopeLike } from '../types'

/**
 * 把 ConfigForm 适配成组件用的 ScopeLike。
 * @param form 宿主配置表单（命名空间 = loader 条目 id）
 * @returns 组件作用域
 */
export function scopeOf<T>(form: ConfigFormLike<T>): ScopeLike<T> {
  return {
    getSnapshot: () => {
      const snap = form.getSnapshot()
      return { status: snap.status, value: snap.value }
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
 * @param form 宿主配置表单
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
