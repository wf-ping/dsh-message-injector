/**
 * 预设组配置卡（settings.plugin.item，设置 → 插件 → 插件配置，F1）
 *
 * 形态与 dsh 官方配置卡（WebSearch/Bash/AgentLoop）同构：可折叠标题栏 + 表单体
 * + 放弃/保存脚注——复用通用组件 ConfigCard（见 components/ConfigCard.tsx）。
 * 预设组块样式（psi-group*）随本组件 CSS 注入；字段样式类由 ConfigCard 提供。
 * 全部走 --dsw-alias-* 令牌；禁止引用 dsh 内部 CSS 类名（构建哈希，升级即断，见坑 7）。
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  IconChevronDownOutline14,
  IconChevronUpOutline14,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { ConfigCard } from './ConfigCard'
import type { ExpandSignal } from './ConfigCard'
import { scrollElementIntoView } from '../utils/scroll'
import { injectStyle } from '../utils/css'
import type { ScopeLike } from '../types'
import type { PresetConfig, PresetGroup } from '../../shared/types'
import { cloneGroup, isSkillLine, normalizeContent, skillNameOf } from '../logic'

export interface CardProps {
  scope: ScopeLike<PresetConfig>
  fetchKnownSkillNames: () => Promise<Set<string> | null>
  t: (key: string) => string
  /** 外部展开信号（选择器菜单「设置」直达） */
  expandSignal: ExpandSignal
}

// ─── 样式（data-plugin-css 注入模式；全部使用 --dsw-alias-* 令牌 → 随主题共变，N1）───
// 仅预设组块；配置卡壳/字段样式由 ConfigCard 组件注入
const CSS = `
.psi-group{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.psi-group+.psi-group{border-top:1px solid var(--dsw-alias-border-l2)}
.psi-groupHead{align-items:center;gap:8px;display:flex}
.psi-groupToggle{appearance:none;min-width:0;flex:1;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px 6px;align-items:center;gap:8px;display:flex}
.psi-groupToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}
.psi-groupToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.psi-groupName{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.psi-groupNameEmpty{color:var(--dsw-alias-label-tertiary)}
.psi-groupChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.psi-groupChevronOpen{transform:rotate(180deg)}
.psi-groupBody{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;margin-top:6px;padding-top:10px;display:flex}
.psi-groupField{flex-direction:column;gap:6px;display:flex}
.psi-groupField+.psi-groupField{border-top:1px solid var(--dsw-alias-border-l2);padding-top:8px}
`

injectStyle('@deepseek-ai/dsh-message-injector/PresetConfigCard.module.css', CSS)

export function PresetConfigCard({ scope, fetchKnownSkillNames, t: tRaw, expandSignal }: CardProps) {
  const t = tRaw ?? ((k: string) => k)
  // 同 PresetSelector：箭头函数包裹，避免丢失 this
  const snap = useSyncExternalStore(
    (listener: () => void) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const [draft, setDraft] = useState<PresetGroup[]>(() =>
    (snap.status === 'ready' ? snap.value?.groups ?? [] : []).map(cloneGroup))
  const [dirty, setDirty] = useState(false)
  const [knownSkills, setKnownSkills] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState('')
  // 各组收起/展开（默认收起；组多了只显示组名，点击才展开编辑）
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({})

  // scope 就绪且用户未编辑时，同步外部配置（多标签页/外部修改）
  useEffect(() => {
    if (dirty) return
    if (snap.status === 'ready' && snap.value) {
      setDraft(snap.value.groups.map(cloneGroup))
      setOpenMap({})
    }
  }, [snap, dirty])

  // 拉取技能目录（有会话时），用于技能调用行的缺失警告（F6-1 警告级校验）
  useEffect(() => {
    let cancelled = false
    void fetchKnownSkillNames().then((names) => { if (!cancelled) setKnownSkills(names) }).catch(() => {})
    return () => { cancelled = true }
  }, [fetchKnownSkillNames])

  const markDirty = (next: PresetGroup[]) => { setDraft(next); setDirty(true) }

  const patch = (i: number, p: Partial<PresetGroup>) =>
    markDirty(draft.map((g, j) => (j === i ? { ...g, ...p } : g)))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= draft.length) return
    const copy = draft.slice()
    const [g] = copy.splice(i, 1)
    copy.splice(j, 0, g)
    markDirty(copy)
    // 展开状态跟随组一起移动
    setOpenMap((m) => {
      const next = { ...m }
      const a = next[i] ?? false
      const b = next[j] ?? false
      next[i] = b
      next[j] = a
      return next
    })
  }

  const removeGroup = (i: number) => {
    markDirty(draft.filter((_, j) => j !== i))
    // 删除后序号左移，展开状态跟着偏移（被删组丢弃）
    setOpenMap((m) => {
      const next: Record<number, boolean> = {}
      for (const [k, v] of Object.entries(m)) {
        const n = Number(k)
        if (n === i) continue
        next[n > i ? n - 1 : n] = v
      }
      return next
    })
  }

  const toggleGroup = (i: number) => setOpenMap((m) => ({ ...m, [i]: !(m[i] ?? false) }))

  const addGroup = () => {
    // 新增组压栈到第一个位置（方便新建后立即在顶部看到/编辑）
    markDirty([{ name: '', description: '', content: [], enabled: true }, ...draft])
    // 新组默认展开（要填组名）；原各组展开状态右移一位
    setOpenMap((m) => {
      const next: Record<number, boolean> = { 0: true }
      for (const [k, v] of Object.entries(m)) next[Number(k) + 1] = v
      return next
    })
    revealFirstGroup()
  }

  /** 新增组若不在滚动容器可视区内，把第一个组（新组）对齐到容器顶部附近，保证完整表单可见 */
  const revealFirstGroup = () => {
    if (typeof document === 'undefined') return
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('.psi-group')
      if (el) scrollElementIntoView(el)
    })
  }

  // 放弃（discard）：丢弃草稿，回到已保存配置
  const discard = () => {
    const s = scope.getSnapshot()
    setDraft((s.status === 'ready' ? s.value?.groups ?? [] : []).map(cloneGroup))
    setDirty(false)
    setFailed('')
  }

  // 字段级实时校验（官方 invalid 语言）：组名空/重复 → 组名行；内容空 → 内容行
  const nameError = (g: PresetGroup, i: number): string => {
    const name = g.name.trim()
    if (name === '') return t('nameRequired')
    if (draft.some((h, j) => j !== i && h.name.trim() === name)) return `${t('nameDuplicate')}：${name}`
    return ''
  }
  const contentError = (g: PresetGroup): string =>
    normalizeContent(g.content).length === 0 ? t('contentRequired') : ''
  // 任一字段非法 → 保存禁用（官方 blocked 逻辑：!dirty || invalid || saving）
  const invalid = draft.some((g, i) => nameError(g, i) !== '' || contentError(g) !== '')

  const save = async () => {
    setFailed('')
    const cleaned = draft.map((g) => ({
      name: g.name.trim(),
      description: g.description.trim(),
      content: normalizeContent(g.content),
      enabled: g.enabled,
    }))
    setSaving(true)
    try {
      await scope.set('groups', cleaned)
      setDraft(cleaned.map(cloneGroup))
      setDirty(false)
    } catch (e) {
      setFailed(t('saveFailed') + (e instanceof Error ? `：${e.message}` : `：${t('errorHint')}`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ConfigCard
      title={t('cardTitle')}
      description={t('cardDesc')}
      dirty={dirty}
      saving={saving}
      invalid={invalid}
      failed={failed}
      onSave={() => void save()}
      onDiscard={discard}
      labels={{
        save: t('save'),
        discard: t('discard'),
        unsaved: t('unsaved'),
        expand: t('expand'),
        collapse: t('collapse'),
      }}
      expandSignal={expandSignal}
    >
      <div className="psi-field psi-addRow">
        <button type="button" className="psi-add" onClick={addGroup}>+ {t('addGroup')}</button>
      </div>
      {draft.map((g, i) => {
        const nErr = nameError(g, i)
        const cErr = contentError(g)
        const isOpen = openMap[i] ?? false
        const missing = knownSkills
          ? g.content
            .map((line) => line.trim())
            .filter((line) => isSkillLine(line) && !knownSkills.has(skillNameOf(line)))
          : []
        return (
          <div key={i} className="psi-group">
            <div className="psi-groupHead">
              <button
                type="button"
                className="psi-groupToggle"
                aria-expanded={isOpen}
                aria-label={`${t(isOpen ? 'collapse' : 'expand')}：${g.name.trim() || t('groupName')}`}
                onClick={() => toggleGroup(i)}
              >
                <span className={'psi-groupName' + (g.name.trim() === '' ? ' psi-groupNameEmpty' : '')}>
                  {g.name.trim() || t('groupName')}
                </span>
                <IconChevronDownOutline14 className={'psi-groupChevron' + (isOpen ? ' psi-groupChevronOpen' : '')} />
              </button>
              <label className="psi-checkLabel">
                <input
                  type="checkbox"
                  className="psi-check"
                  checked={g.enabled}
                  onChange={(e: { target: { checked: boolean } }) => patch(i, { enabled: e.target.checked })}
                />
                {t('enabled')}
              </label>
              <button type="button" className="psi-iconBtn" title={t('moveUp')} disabled={i === 0} onClick={() => move(i, -1)}>
                <IconChevronUpOutline14 />
              </button>
              <button type="button" className="psi-iconBtn" title={t('moveDown')} disabled={i === draft.length - 1} onClick={() => move(i, 1)}>
                <IconChevronDownOutline14 />
              </button>
              <button type="button" className="psi-iconBtn" title={t('remove')} onClick={() => removeGroup(i)}>
                <IconTrashOutline16 />
              </button>
            </div>
            {isOpen && (
              <div className="psi-groupBody">
                <div className="psi-groupField">
                  <div className="psi-head">
                    <span className="psi-label">{t('groupName')}</span>
                  </div>
                  <input
                    className={'psi-input' + (nErr !== '' ? ' psi-inputInvalid' : '')}
                    value={g.name}
                    placeholder={t('groupName')}
                    onChange={(e: { target: { value: string } }) => patch(i, { name: e.target.value })}
                  />
                  {nErr !== '' && <p className="psi-invalid">{nErr}</p>}
                </div>
                <div className="psi-groupField">
                  <div className="psi-head">
                    <span className="psi-label">{t('description')}</span>
                  </div>
                  <input
                    className="psi-input"
                    value={g.description}
                    placeholder={t('description')}
                    onChange={(e: { target: { value: string } }) => patch(i, { description: e.target.value })}
                  />
                </div>
                <div className="psi-groupField">
                  <div className="psi-head">
                    <span className="psi-label">{t('content')}</span>
                  </div>
                  <textarea
                    className={'psi-textarea' + (cErr !== '' ? ' psi-inputInvalid' : '')}
                    value={g.content.join('\n')}
                    placeholder={t('content')}
                    onChange={(e: { target: { value: string } }) => patch(i, { content: e.target.value.split('\n') })}
                  />
                  {cErr !== '' && <p className="psi-invalid">{cErr}</p>}
                  {missing.length > 0 && (
                    <p className="psi-warn">{t('missingSkills')}{missing.join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </ConfigCard>
  )
}
