/**
 * 预设管理弹窗（自包含，不依赖 dsh 设置面板）
 *
 * 入口：输入框左下角「预设」菜单底部「配置」→ 本弹窗。
 * 内容复用 PresetConfigCard（同一套增删改查 + 校验），弹窗只负责壳：
 * 遮罩、面板、标题、关闭；Esc / 点遮罩 / 右上 × 关闭。
 * 用 createPortal 挂到 body，避免被输入框区域的 overflow/transform 裁切。
 */
import { useEffect } from 'react'
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
.psi-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.38);align-items:flex-start;justify-content:center;padding:64px 16px 24px;display:flex;overflow:auto}
.psi-dialog{width:100%;max-width:720px;max-height:calc(100vh - 96px);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.28);flex-direction:column;display:flex;overflow:hidden}
.psi-dialogHead{align-items:center;gap:8px;padding:14px 16px 10px;display:flex}
.psi-dialogTitle{flex:1;min-width:0;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.psi-dialogClose{appearance:none;cursor:pointer;background:0 0;border:0;border-radius:8px;color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;justify-content:center;width:28px;height:28px;display:inline-flex;padding:0}
.psi-dialogClose:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.psi-dialogClose:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-dialogBody{flex-direction:column;gap:12px;padding:0 16px 16px;display:flex;overflow:auto}
.psi-dialogHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.6}
`

injectStyle('@deepseek-ai/dsh-message-injector/PresetDialog.module.css', CSS)

export function PresetDialog({ scope, fetchKnownSkillNames, t, onClose }: PresetDialogProps) {
  // Esc 关闭
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="psi-overlay"
      role="presentation"
      onMouseDown={(event: { target: EventTarget; currentTarget: EventTarget }) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="psi-dialog" role="dialog" aria-modal="true" aria-label={t('cardTitle')}>
        <div className="psi-dialogHead">
          <span className="psi-dialogTitle">{t('cardTitle')}</span>
          <button type="button" className="psi-dialogClose" aria-label={t('close')} title={t('close')} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="psi-dialogBody">
          <PresetConfigCard
            scope={scope}
            fetchKnownSkillNames={fetchKnownSkillNames}
            t={t}
            expandSignal={alwaysExpand}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
