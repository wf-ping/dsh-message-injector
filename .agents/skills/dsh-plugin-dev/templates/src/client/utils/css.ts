/**
 * CSS 注入通用工具：以 data-plugin-css 标记注入 <style>（dsh 官方同款机制），
 * 同一 tagId 只注入一次（插件热重载/重复加载不重复注入）。
 */
export function injectStyle(tagId: string, css: string) {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-hello-plugin'
  tag.dataset.pluginCss = tagId
  tag.textContent = css
  document.head.appendChild(tag)
}
