/**
 * 滚动控制通用工具（前端专用，纯 TS，无 JSX）
 *
 * 场景：把某个元素滚动到最近的可滚动容器可视区内——例如新增预设组后
 * 露出新组表单、设置直达后露出配置卡。任意组件都可直接调用函数，
 * 或挂一个 ref 用 useReveal 钩子（展开/信号触发时自动滚动）。
 *
 * 约定：只认「可滚动祖先」（overflow-y 为 auto/scroll/overlay 的容器）；
 * 没有可滚动祖先时退化为元素自身的 scrollIntoView。
 */
import { useEffect, useRef } from 'react'

export interface RevealOptions {
  /** 顶部/边缘留白（px），默认 8 */
  pad?: number
  /** 对齐方式：start（容器顶部，默认）/ center（容器中部）/ nearest（最小滚动，仅移入视口） */
  align?: 'start' | 'center' | 'nearest'
}

/** 向上找最近的可滚动祖先（overflow-y: auto|scroll|overlay）；找不到返回 null */
export function findScrollContainer(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    const style = getComputedStyle(node)
    if (/(auto|scroll|overlay)/.test(style.overflowY)) return node
    node = node.parentElement
  }
  return null
}

/**
 * 把元素滚到可视区。元素已完全可见时不滚动（不打扰）。
 * - align=start：元素顶部对齐容器顶部（留 pad）
 * - align=center：元素居中于容器
 * - align=nearest：最小滚动，只保证完整可见
 */
export function scrollElementIntoView(el: HTMLElement, opts: RevealOptions = {}) {
  const { pad = 8, align = 'start' } = opts
  const container = findScrollContainer(el)
  if (!container) {
    el.scrollIntoView({ block: align === 'nearest' ? 'nearest' : 'start' })
    return
  }
  const er = el.getBoundingClientRect()
  const cr = container.getBoundingClientRect()
  if (er.top >= cr.top && er.bottom <= cr.bottom) return
  if (align === 'center') {
    container.scrollTop += er.top - cr.top - (cr.height - er.height) / 2
  } else if (align === 'nearest') {
    if (er.top < cr.top) container.scrollTop += er.top - cr.top - pad
    else if (er.bottom > cr.bottom) container.scrollTop += er.bottom - cr.bottom + pad
  } else {
    container.scrollTop += er.top - cr.top - pad
  }
}

/**
 * React 钩子：挂到目标元素的 ref 上，当「when 由 false 变 true 且 open 为真」时
 * 滚动该元素进入可视区（一次性触发；双 rAF 等布局稳定）。
 *
 * 典型用法：展开面板 + 信号（如"从别处请求露出"）双条件——信号到达时滚动，
 * 用户手动展开不滚动。
 *
 * @param open 目标是否处于展开/可见状态
 * @param when 触发条件（false→true 的那一次生效）
 * @param opts 滚动选项
 * @returns 目标元素的 ref
 */
export function useReveal(open: boolean, when: boolean, opts?: RevealOptions) {
  const ref = useRef<HTMLElement | null>(null)
  const prev = useRef<{ open: boolean; when: boolean }>({ open, when })
  useEffect(() => {
    const wasWhen = prev.current.when
    prev.current = { open, when }
    if (when && !wasWhen && open) {
      // 双 rAF：等展开渲染完成、布局稳定后再滚动
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) scrollElementIntoView(ref.current, opts)
        })
      })
    }
  }, [open, when])
  return ref
}
