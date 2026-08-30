/**
 * 预设选择器（conversation.input.left 槽，输入框左下角，F2）
 *
 * 样式与权限选择器同款并随主题共变（N1）：全部 --dsw-alias-* 令牌 + 官方 Menu 组件。
 * 菜单底部含「设置」快捷入口（onOpenSettings，由入口接线：打开设置 + 展开配置卡）。
 */
import { useState, useSyncExternalStore } from 'react'
import {
  Menu,
  IconSkillOutline16,
  IconChevronDownOutline14,
  IconSettingsOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { injectStyle } from '../utils/css'
import type { ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'

export interface SelectorProps {
  scope: ScopeLike<PresetConfig>
  t: (key: string) => string
  /** 菜单底部「设置」入口回调（入口接线：打开设置面板 + 请求配置卡展开） */
  onOpenSettings: () => void
}

// ─── 样式（data-plugin-css 注入模式；全部使用 --dsw-alias-* 令牌 → 随主题共变，N1）───
const CSS = `
.psi-trigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.psi-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.psi-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-trigger svg{width:14px;height:14px}
.psi-chevron{color:var(--dsw-alias-label-caption);transition:transform .12s}
.psi-chevron-open{transform:rotate(180deg)}
`

injectStyle('@deepseek-ai/dsh-message-injector/PresetSelector.module.css', CSS)

export function PresetSelector({ scope, t: tRaw, onOpenSettings }: SelectorProps) {
  const t = tRaw ?? ((k: string) => k)
  // 注意：必须用箭头函数包一层，否则 useSyncExternalStore 调用时丢失 this（SettingsScopeController 的方法依赖 this.store）
  const snap = useSyncExternalStore(
    (listener: () => void) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const [open, setOpen] = useState(false)
  const config = snap.status === 'ready' ? snap.value : undefined
  const groups = (config?.groups ?? []).filter((g) => g.enabled)
  const selected = config?.selected ?? ''
  // 选中项若已被禁用/删除 → 视作未选中（F6-6 兜底，后端侧也会清除 selected）
  const current = groups.find((g) => g.name === selected)

  const items = groups.length === 0
    ? [{ id: '__none__', label: t('empty'), disabled: true }]
    : groups.map((g) => ({ id: g.name, label: g.name }))

  const choose = (id: string) => {
    setOpen(false)
    if (id === '__settings__') {
      // 快捷入口：打开设置面板 → 自动切到「插件」分区 → 配置卡自动展开（定位失败时优雅降级）
      onOpenSettings()
      return
    }
    if (id === '__none__') return
    if (id === selected) {
      // 反选：再次点击当前选中项 → 取消选择，确保不再注入
      void scope.set('selected', '')
    } else {
      void scope.set('selected', id)
    }
  }

  return (
    <Menu
      open={open}
      items={items}
      selectedId={current ? selected : undefined}
      onSelect={choose}
      onClose={() => setOpen(false)}
      side="top"
      footer={[{ id: '__settings__', label: t('openSettings'), icon: <IconSettingsOutline16 /> }]}
      anchor={(
        <button
          type="button"
          className="psi-trigger"
          aria-label={t('selectPreset')}
          title={current?.description || t('selectPreset')}
          onClick={() => setOpen(!open)}
        >
          <IconSkillOutline16 />
          <span>{current ? current.name : t('preset')}</span>
          <IconChevronDownOutline14 className={'psi-chevron' + (open ? ' psi-chevron-open' : '')} />
        </button>
      )}
    />
  )
}
