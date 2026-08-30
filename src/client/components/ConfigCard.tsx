/**
 * 配置卡通用组件（Config Card）
 *
 * 复刻 dsh 官方配置卡壳（设置 → 插件 → 插件配置 中 WebSearch/Bash/AgentLoop 同款）：
 * 可折叠标题栏（名称 + 描述 + 未保存徽标）+ 表单体（children）+ 放弃/保存脚注。
 * 任何插件配置界面接入它即可获得与官方一致的观感与交互：
 *   - 视觉参数照抄官方（radius 12 / border l2 / bg layer-3 / input 34px），
 *     全部走 --dsw-alias-* 令牌 + 自有类名（禁止引用 dsh 内部 CSS 类名，构建哈希升级即断）；
 *   - 表单字段样式（psi-field/psi-input/psi-textarea/psi-check 等）随本组件 CSS 一并注入，
 *     供 children 直接使用；
 *   - 支持外部「展开信号」（如"设置直达"）：已挂载立即展开，未挂载信号挂起、挂载即消费；
 *   - 展开后可选择自动滚动露出（useReveal，默认开启；手动开合不滚动）。
 */
import { useEffect, useState } from 'react'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import { useReveal } from '../utils/scroll'
import { injectStyle } from '../utils/css'

export interface ConfigCardLabels {
  save?: string
  discard?: string
  unsaved?: string
  expand?: string
  collapse?: string
}

/** 外部展开信号：subscribe 订阅实时信号；consumePending 消费挂起的信号（挂载时调用） */
export interface ExpandSignal {
  subscribe(fn: () => void): () => void
  consumePending(): boolean
}

export interface ConfigCardProps {
  /** 标题栏名称 */
  title: string
  /** 标题栏描述 */
  description: string
  /** 表单体（字段块等，随本组件的字段样式类注入） */
  children?: unknown
  /** 是否有未保存修改（标题栏「未保存」徽标 + 按钮可用性） */
  dirty: boolean
  /** 是否保存中（按钮禁用 + 保存中态） */
  saving: boolean
  /** 是否存在校验错误（保存按钮禁用；字段级错误由 children 自行展示） */
  invalid?: boolean
  /** 保存失败信息（脚注 failed 位；空串不显示） */
  failed?: string
  /** 点击保存 */
  onSave: () => void
  /** 点击放弃 */
  onDiscard: () => void
  /** 文案覆盖（缺省用英文） */
  labels?: ConfigCardLabels
  /** 外部展开信号（如「设置直达」）；不传则不响应 */
  expandSignal?: ExpandSignal
  /** 信号展开后自动滚动露出（默认 true；手动开合不滚动） */
  revealOnExpand?: boolean
  /** 初始展开（默认 false） */
  defaultOpen?: boolean
}

// ─── 样式（data-plugin-css 注入模式；全部使用 --dsw-alias-* 令牌 → 随主题共变，N1）───
// 与 dsh 官方配置卡（PluginCard + fields）视觉参数一致：卡 radius 12 / border l2 / bg layer-3，
// input 34px / radius 8px / focus 品牌色描边；字段块间 border-top 分隔；脚注「放弃/保存」。
const CSS = `
.psi-shell{list-style:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;transition:border-color .16s,background .16s}
.psi-shell:hover{border-color:var(--dsw-alias-label-dimmed)}
.psi-shellOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.psi-shellHeader{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.psi-shellHeader:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.psi-shellHeadText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.psi-shellName{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.psi-shellDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.psi-shellChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.psi-shellChevronOpen{transform:rotate(180deg)}
.psi-shellPending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}
.psi-shellBody{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
.psi-shellFooter{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
.psi-shellFailed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
.psi-shellDiscard,.psi-shellSave{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.psi-shellDiscard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
.psi-shellDiscard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.psi-shellSave{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.psi-shellDiscard:disabled,.psi-shellSave:disabled{opacity:.4;cursor:default}
.psi-shellDiscard:focus-visible,.psi-shellSave:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.psi-field+.psi-field{border-top:1px solid var(--dsw-alias-border-l2)}
.psi-head{align-items:center;gap:8px;display:flex}
.psi-label{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.psi-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.psi-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.psi-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.psi-inputInvalid{border-color:var(--dsw-alias-label-error)}
.psi-textarea{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:13px;line-height:1.5;min-height:64px;resize:vertical}
.psi-textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.psi-check{accent-color:var(--dsw-alias-label-secondary)}
.psi-checkLabel{display:inline-flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;cursor:pointer;white-space:nowrap}
.psi-iconBtn{appearance:none;font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px;display:inline-flex;align-items:center}
.psi-iconBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-iconBtn:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.psi-iconBtn svg{width:14px;height:14px}
.psi-add{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.psi-add:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
.psi-addRow{align-items:flex-start}
.psi-warn{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-caption));margin:0;font-size:12px;line-height:1.5}
.psi-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.psi-invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
`

injectStyle('@deepseek-ai/dsh-message-injector/ConfigCard.module.css', CSS)

const DEFAULT_LABELS: Required<ConfigCardLabels> = {
  save: 'Save',
  discard: 'Discard',
  unsaved: 'Unsaved',
  expand: 'Expand',
  collapse: 'Collapse',
}

export function ConfigCard(props: ConfigCardProps) {
  const {
    title,
    description,
    children,
    dirty,
    saving,
    invalid = false,
    failed = '',
    onSave,
    onDiscard,
    labels,
    expandSignal,
    revealOnExpand = true,
    defaultOpen = false,
  } = props
  const t = (key: keyof ConfigCardLabels): string => labels?.[key] ?? DEFAULT_LABELS[key]
  const [open, setOpen] = useState(defaultOpen)
  // 信号展开后的"滚动露出"标记（一次性；手动开合不滚动）
  const [autoReveal, setAutoReveal] = useState(false)
  const shellRef = useReveal(open, autoReveal)

  // 外部展开信号（如「设置直达」）：已挂载 → 立即展开；未挂载 → 挂起，挂载时消费
  useEffect(() => {
    if (!expandSignal) return
    if (expandSignal.consumePending()) {
      setOpen(true)
      if (revealOnExpand) setAutoReveal(true)
    }
    return expandSignal.subscribe(() => {
      setOpen(true)
      if (revealOnExpand) setAutoReveal(true)
    })
  }, [expandSignal])

  // 消费滚动标记：滚过一次后清除，避免之后手动开合误触发滚动
  useEffect(() => {
    if (autoReveal) setAutoReveal(false)
  }, [autoReveal])

  return (
    <li ref={shellRef} className={'psi-shell' + (open ? ' psi-shellOpen' : '')}>
      <button
        type="button"
        className="psi-shellHeader"
        aria-expanded={open}
        aria-label={`${t(open ? 'collapse' : 'expand')}：${title}`}
        onClick={() => setOpen(!open)}
      >
        <span className="psi-shellHeadText">
          <span className="psi-shellName">{title}</span>
          <span className="psi-shellDesc">{description}</span>
        </span>
        {dirty && <span className="psi-shellPending">{t('unsaved')}</span>}
        <IconChevronDownOutline14 className={'psi-shellChevron' + (open ? ' psi-shellChevronOpen' : '')} />
      </button>
      {open && (
        <div className="psi-shellBody">
          {children}
          <div className="psi-shellFooter">
            {failed !== '' && <p className="psi-shellFailed" role="status">{failed}</p>}
            <button type="button" className="psi-shellDiscard" disabled={!dirty || saving} onClick={onDiscard}>
              {t('discard')}
            </button>
            <button type="button" className="psi-shellSave" disabled={!dirty || saving || invalid} onClick={onSave}>
              {saving ? '…' : t('save')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
