/**
 * logic（纯业务逻辑目录）：无 React、无 DOM、无副作用的函数，最好测。
 * 示例：数字格式化（被配置卡示例使用）。
 */
export function formatCount(n: number): string {
  return n.toLocaleString()
}
