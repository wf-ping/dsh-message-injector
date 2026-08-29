/**
 * 最小环境类型桩（本项目零依赖自包含）：
 * - react / react/jsx-runtime：浏览器运行时由 dsh web shell 提供，这里只做类型声明
 * - @deepseek-ai/dsh-client-ui-primitives：内置于 web shell 的 staticModules，
 *   磁盘上不存在（profile node_modules 中无此包），运行时由浏览器模块加载器提供
 */

declare module 'react' {
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useMemo<T>(factory: () => T, deps?: readonly unknown[]): T
  export function useRef<T>(initial: T): { current: T }
  export function useSyncExternalStore<Snap>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => Snap,
  ): Snap
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown
  export const jsxs: unknown
  export const Fragment: unknown
}

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  /** 通用下拉菜单（PermissionSelect 同款） */
  export const Menu: any
  export const Button: any
  export const Tooltip: any
  export const RiskConfirmation: any
  /** 图标（按 名称+尺寸 命名） */
  export const IconSkillOutline16: any
  export const IconPersonalizationOutline16: any
  export const IconChecklistOutline14: any
  export const IconChevronDownOutline14: any
  export const IconCloseFill14: any
  export const IconPlusOutline16: any
  export const IconEditOutline16: any
  export const IconTrashOutline16: any
}

declare namespace JSX {
  interface IntrinsicElements {
    div: Record<string, unknown> & { children?: unknown }
    span: Record<string, unknown> & { children?: unknown }
    button: Record<string, unknown> & { children?: unknown }
    input: Record<string, unknown> & { children?: unknown }
    textarea: Record<string, unknown> & { children?: unknown }
    label: Record<string, unknown> & { children?: unknown }
    form: Record<string, unknown> & { children?: unknown }
    small: Record<string, unknown> & { children?: unknown }
    strong: Record<string, unknown> & { children?: unknown }
    ul: Record<string, unknown> & { children?: unknown }
    li: Record<string, unknown> & { children?: unknown }
  }
}
