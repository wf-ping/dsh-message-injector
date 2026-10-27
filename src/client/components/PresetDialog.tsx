/**
 * 预设管理弹窗（自包含，不依赖 dsh 设置面板）
 *
 * 入口：输入框左下角「预设」菜单底部「配置」→ 本弹窗。
 * 内容复用 PresetConfigCard（同一套增删改查 + 校验），弹窗只负责壳。
 *
 * 实现用原生 <dialog> + showModal()：定位/遮罩/层级由浏览器 top layer 负责，
 * 不受宿主容器的 overflow / transform / z-index 影响（自绘 overlay 会被上下文带偏）。
 * 关闭：Esc（原生 cancel）、点遮罩、右上 ×。
 */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PresetConfigCard } from './PresetConfigCard'
import type { ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'
import { injectStyle } from '../utils/css'
import { createOneShotSignal } from '../utils/signal'

export interface PresetDialogProps {
  scope: ScopeLike<PresetConfig>
  fetchKnownSkillNames: () => Promise<Set<string> | null>
  t: (key: string) => string
  onClose: () => void
}

// 弹窗内始终展开配置卡：一次性信号在挂载时请求、卡挂载即消费
const alwaysExpand = createOneShotSignal()
alwaysExpand.request()

const CSS = `
dialog.psi-modal{width:min(720px,calc(100vw - 32px));max-width:720px;max-height:calc(100vh - 96px);margin:auto;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);overflow:hidden}
dialog.psi-modal::backdrop{background:rgba(0,0,0,.38)}
.psi-modalShell{flex-direction:column;display:flex;max-height:calc(100vh - 96px)}
.psi-modalHead{align-items:center;gap:8px;padding:14px 16px 10px;display:flex}
.psi-modalTitle{flex:1;min-width:0;font-size:15px;font-weight:600;line-height:1.4}
.psi-modalClose{appearance:none;cursor:pointer;background:0 0;border:0;border-radius:8px;color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;justify-content:center;width:28px;height:28px;display:inline-flex;padding:0;font-size:18px;line-height:1}
.psi-modalClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.psi-modalClose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-modalBody{flex-direction:column;gap:12px;padding:0 16px 16px;display:flex;overflow:auto}
`

injectStyle('@deepseek-ai/dsh-message-injector/PresetDialog.module.css', CSS)

export function PresetDialog({ scope, fetchKnownSkillNames, t, onClose }: PresetDialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null)

  // 挂载即以模态方式打开（top layer）；卸载时若仍打开则关闭
  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof element.showModal === 'function' && !element.open) element.showModal()
    return () => {
      if (typeof element.close === 'function' && element.open) element.close()
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <dialog
      ref={ref}
      className="psi-modal"
      aria-label={t('cardTitle')}
      onCancel={(event: { preventDefault(): void }) => {
        event.preventDefault()
        onClose()
      }}
      // 点遮罩关闭：事件命中 dialog 自身（内容在 .psi-modalShell 内）
      onMouseDown={(event: { target: EventTarget; currentTarget: EventTarget }) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="psi-modalShell">
        <div className="psi-modalHead">
          <span className="psi-modalTitle">{t('cardTitle')}</span>
          <button type="button" className="psi-modalClose" aria-label={t('close')} title={t('close')} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="psi-modalBody">
          <PresetConfigCard
            scope={scope}
            fetchKnownSkillNames={fetchKnownSkillNames}
            t={t}
            expandSignal={alwaysExpand}
          />
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
