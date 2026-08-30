/**
 * dsh 设置面板定位（无公共 API 的折中方案）
 *
 * dsh 的 SettingsRoot 打开状态、分区 activeId 均为组件内部 state，无事件/服务暴露；
 * 只能按官方 aria 属性 + 官方导航文案定位（均非哈希类名，相对稳定）：
 *   1. 触发器：button[aria-haspopup="dialog"]（Modal 等原生组件不用 dialog 值）
 *   2. 分区：设置面板 nav 内按文案匹配（如 /插件|Plugins/，覆盖 zh/en 两种 shell 语言）
 * 面板渲染是异步的，用 100ms×15 重试等待；任一步失败静默返回（优雅降级）。
 */

/** 设置面板：带 nav 的模态对话框 */
function findSettingsPanel(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  for (const d of dialogs) {
    if (d.querySelector('nav')) return d
  }
  return null
}

/**
 * 打开设置面板并切到指定分区（按导航文案匹配；已打开/已激活则跳过）。
 * @param navLabel 分区按钮文案匹配（如 /插件|Plugins/）
 */
export async function openSettingsSection(navLabel: RegExp): Promise<void> {
  if (typeof document === 'undefined') return
  // 1) 打开设置面板（已打开则跳过）
  const trigger = document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')
  if (trigger && trigger.getAttribute('aria-expanded') !== 'true') trigger.click()
  // 2) 等面板渲染，点击匹配的分区按钮；匹配失败 → 放弃（调用方自行降级）
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const panel = findSettingsPanel()
    if (!panel) continue
    const nav = panel.querySelector('nav')
    if (!nav) return
    const target = Array.from(nav.querySelectorAll('button'))
      .find((b) => navLabel.test(b.textContent ?? ''))
    if (!target) return
    if (target.getAttribute('aria-current') !== 'true') target.click()
    return
  }
}
