/**
 * dsh-message-injector — 前端（dsh 官方称 Client half）
 *
 * 职责：
 *  - 预设选择器按钮（conversation.input.left 槽，输入框左下角，F2）
 *  - 预设组配置卡（settings.plugin.item 槽，设置 → 插件 → 插件配置，F1）
 *  - 500ms 轮询自动注入（F4）与注入守卫（F5）
 *
 * 内容为任意文本：以 / 开头的行视为技能调用（校验存在性，缺失时警告并跳过）；
 * 其余行原样注入。
 *
 * 本文件由 scripts/build.mjs 预构建为 lib/client.js（window.__ModuleLoader__.load 形态），
 * 浏览器端无 TS 编译。
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { scrollElementIntoView } from './utils/scroll'
import { injectStyle } from './utils/css'
import { ConfigCard } from './components/ConfigCard'
import type { ExpandSignal } from './components/ConfigCard'
import {
  Menu,
  IconSkillOutline16,
  IconChevronDownOutline14,
  IconChevronUpOutline14,
  IconTrashOutline16,
  IconSettingsOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'

// ─── 领域类型（与后端 schema 对齐）──────────────────────────────
interface PresetGroup {
  name: string
  description: string
  /** 注入内容：任意文本，每行一条；以 / 开头的行视为技能调用（如 /grill-me） */
  content: string[]
  enabled: boolean
}

interface PresetConfig {
  groups: PresetGroup[]
  selected: string
}

// ─── 防御式服务类型（运行时按需取用，避免对内部包的强类型依赖）────────────
interface ScopeLike<T> {
  getSnapshot(): { status: string; value?: T }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

interface InputLike {
  setDraft(text: string): void
  state: { getSnapshot(): { draft: string; phase: string } }
}

interface RootCtx {
  effect(fn: () => void | (() => void), label?: string): void
  slots: {
    inject(key: string, cb: () => unknown): void
    register(opts: Record<string, unknown>, comp: unknown): () => void
  }
  locale: { register(ns: string, dict: Record<string, Record<string, string>>): void }
  sessions: {
    list: { getSnapshot(): { current?: string } }
    scope(id: string): { get(name: string): unknown } | undefined
  }
  settingsScope: { bind<T>(spec: { namespace: string }): ScopeLike<T> }
  connection: {
    api: {
      skills: {
        list(req: { sessionId: string }, signal?: AbortSignal): Promise<{ value?: { skills?: { name: string }[] } }>
      }
    }
  }
  get(name: string): unknown
}

export const NS = 'message-injector'

export const inject = ['slots', 'locale', 'sessions', 'settingsScope', 'connection'] as const

// ─── 词典（zh/en）──────────────────────────────────────────────────────
const dict: Record<string, Record<string, string>> = {
  zh: {
    preset: '预设',
    selectPreset: '选择预设组',
    openSettings: '设置',
    empty: '暂无已启用的预设组',
    groupName: '组名',
    description: '描述',
    content: '内容（每行一条）',
    enabled: '启用',
    addGroup: '添加预设组',
    save: '保存',
    remove: '删除',
    moveUp: '上移',
    moveDown: '下移',
    missingSkills: '以下技能不存在，注入时将跳过：',
    saveFailed: '保存失败',
    nameRequired: '组名不能为空',
    nameDuplicate: '组名重复',
    contentRequired: '内容列表不能为空',
    errorHint: '出错请检查输入后重试',
    cardTitle: '消息注入',
    cardDesc: '预设注入内容组合，选中后每条消息自动注入输入框首行',
    unsaved: '未保存',
    discard: '放弃',
    expand: '展开',
    collapse: '收起',
  },
  en: {
    preset: 'Preset',
    selectPreset: 'Select a preset group',
    openSettings: 'Settings',
    empty: 'No enabled preset groups',
    groupName: 'Name',
    description: 'Description',
    content: 'Content (one per line)',
    enabled: 'Enabled',
    addGroup: 'Add preset group',
    save: 'Save',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    missingSkills: 'Missing skills, skipped when injecting: ',
    saveFailed: 'Save failed',
    nameRequired: 'Name is required',
    nameDuplicate: 'Duplicate name',
    contentRequired: 'At least one content line is required',
    errorHint: 'Check the input and retry',
    cardTitle: 'Message Injector',
    cardDesc: 'Preset content combos; the active one is injected into the input first line on every message',
    unsaved: 'Unsaved',
    discard: 'Discard',
    expand: 'Expand',
    collapse: 'Collapse',
  },
}

// ─── 样式（data-plugin-css 注入模式；全部使用 --dsw-alias-* 令牌 → 随主题共变，N1）───
// 仅选择器按钮与预设组块；配置卡壳/字段样式由通用组件 src/client/components/ConfigCard.tsx 注入
const CSS = `
.psi-trigger{min-width:0;max-width:220px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}
.psi-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.psi-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}
.psi-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-trigger svg{width:14px;height:14px}
.psi-chevron{color:var(--dsw-alias-label-caption);transition:transform .12s}
.psi-chevron-open{transform:rotate(180deg)}
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

injectStyle('@deepseek-ai/dsh-message-injector/PresetSelector.module.css', CSS)

// ─── 纯逻辑 ─────────────────────────────────────────────────────────────
/** 内容归一化：去空白、去空行、去重（保持原样，不做 / 处理） */
function normalizeContent(raw: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const r of raw) {
    const line = r.trim()
    if (line === '' || seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  return out
}

/** 是否为技能调用行（以 / 开头且有名字） */
function isSkillLine(line: string): boolean {
  return line.startsWith('/') && line.length > 1
}

/** 技能调用行 → 技能名（去掉前导 /） */
function skillNameOf(line: string): string {
  return line.replace(/^\//, '')
}

// ─── 模块级信号：选择器菜单「设置」→ 打开设置面板并展开配置卡 ─────────────
// dsh 无公共 API 程序化打开设置（SettingsRoot 的 open/分区均为内部 state），
// 采用官方 aria 属性 + 官方导航文案定位（均非哈希类名，相对稳定）：
//   1. 触发器：button[aria-haspopup="dialog"]（Modal 等原生组件不用 dialog 值）
//   2. 分区：设置面板 nav 内按文案「插件」/「Plugins」（zh/en 词典，覆盖两种 shell 语言）
//   3. 卡展开：模块级信号，已挂载立即展开；未挂载（如分区定位失败）挂起，
//      用户手动切到插件分区、卡挂载时自动展开 —— 全程优雅降级
let pendingCardExpand = false
const cardExpandListeners = new Set<() => void>()

function requestCardExpand() {
  pendingCardExpand = true
  for (const fn of cardExpandListeners) fn()
}

/** 挂载时消费挂起的展开信号（消费后清除，避免下次打开设置误展开） */
function consumeCardExpand(): boolean {
  if (!pendingCardExpand) return false
  pendingCardExpand = false
  return true
}

function subscribeCardExpand(fn: () => void): () => void {
  cardExpandListeners.add(fn)
  return () => { cardExpandListeners.delete(fn) }
}

/** 稳定的信号对象（ConfigCard 的 expandSignal prop；身份恒定，避免每次渲染重复订阅） */
const cardExpandSignal: ExpandSignal = {
  subscribe: subscribeCardExpand,
  consumePending: consumeCardExpand,
}

/** 设置面板：带 nav 的模态对话框 */
function findSettingsPanel(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  for (const d of dialogs) {
    if (d.querySelector('nav')) return d
  }
  return null
}

async function openSettingsAndExpand() {
  requestCardExpand()
  if (typeof document === 'undefined') return
  // 1) 打开设置面板（已打开则跳过）
  const trigger = document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')
  if (trigger && trigger.getAttribute('aria-expanded') !== 'true') trigger.click()
  // 2) 等面板渲染，点击「插件」分区（默认 tab 即「插件配置」，无需再切）
  //    匹配失败 → 放弃自动定位，展开信号保持挂起（用户手动切分区后卡仍自动展开）
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const panel = findSettingsPanel()
    if (!panel) continue
    const nav = panel.querySelector('nav')
    if (!nav) return
    const target = Array.from(nav.querySelectorAll('button'))
      .find((b) => /插件|Plugins/.test(b.textContent ?? ''))
    if (!target) return
    if (target.getAttribute('aria-current') !== 'true') target.click()
    return
  }
}

// ─── 组件：预设选择器（conversation.input.left，输入框左下角）───────────────
interface SelectorProps {
  scope: ScopeLike<PresetConfig>
  t: (key: string) => string
}

function PresetSelector({ scope, t: tRaw }: SelectorProps) {
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
      void openSettingsAndExpand()
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

// ─── 组件：预设组配置卡（settings.plugin.item，设置 → 插件 → 插件配置）──────
// 形态与 dsh 官方配置卡（WebSearch/Bash/AgentLoop）同构：可折叠标题栏 + 表单体
// + 放弃/保存脚注；视觉参数照抄官方（radius 12 / border l2 / bg layer-3 / input 34px），
// 全部走 --dsw-alias-* 令牌。禁止引用 dsh 内部 CSS 类名（构建哈希，升级即断，见坑 12）。
interface CardProps {
  scope: ScopeLike<PresetConfig>
  fetchKnownSkillNames: () => Promise<Set<string> | null>
  t: (key: string) => string
}

function cloneGroup(g: PresetGroup): PresetGroup {
  return { name: g.name, description: g.description, content: [...g.content], enabled: g.enabled }
}

function PresetConfigCard({ scope, fetchKnownSkillNames, t: tRaw }: CardProps) {
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
      expandSignal={cardExpandSignal}
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

// ─── 技能目录缓存（按会话 + 30s TTL；校验失败视为「不校验」，按配置原样注入）──
let skillsCache: { sessionId: string; names: Set<string>; at: number } | null = null

async function fetchKnownSkillNames(ctx: RootCtx, sessionId: string): Promise<Set<string> | null> {
  const now = Date.now()
  if (skillsCache && skillsCache.sessionId === sessionId && now - skillsCache.at < 30_000) {
    return skillsCache.names
  }
  try {
    const res = await ctx.connection.api.skills.list({ sessionId })
    const list = res?.value?.skills
    if (!Array.isArray(list)) return null
    const names = new Set<string>()
    for (const sk of list) {
      if (sk && typeof sk.name === 'string' && sk.name !== '') names.add(sk.name)
    }
    skillsCache = { sessionId, names, at: now }
    return names
  } catch {
    return null
  }
}

// ─── 自动注入（F4）+ 注入守卫（F5）：500ms 轮询 ───────────────────────────
async function tick(ctx: RootCtx, scope: ScopeLike<PresetConfig>) {
  const snap = scope.getSnapshot()
  if (snap.status !== 'ready' || !snap.value) return
  const { groups, selected } = snap.value
  if (selected === '') return
  const group = groups.find((g) => g.name === selected)
  if (!group || !group.enabled) return

  const sessionId = ctx.sessions.list.getSnapshot().current
  if (!sessionId) return
  const actx = ctx.sessions.scope(sessionId)
  if (!actx) return
  const conversation = actx.get('conversation') as { input?: { for(a: unknown): InputLike } } | undefined
  const input = conversation?.input?.for(actx)
  if (!input) return
  const s = input.state.getSnapshot()
  // 守卫 1：非 plain 相位（提交中/忙态）不注入
  if (s.phase !== 'plain') return
  // 守卫 2：输入框去掉空白后非空 → 不注入（保护已有内容）
  if (s.draft.trim() !== '') return
  // 守卫 3：IME 组合期间 textarea.value 含未提交文本而 state.draft 为空 → 跳过
  if (typeof document !== 'undefined') {
    const ta = document.querySelector<HTMLTextAreaElement>('[data-input-scroll] textarea')
    if (ta && ta.value.trim() !== '') return
  }

  let lines = normalizeContent(group.content)
  if (lines.length === 0) return
  // F6-1 运行期保守：技能调用行（/ 开头）校验存在性，缺失跳过；普通文本原样注入
  const known = await fetchKnownSkillNames(ctx, sessionId)
  if (known) {
    lines = lines.filter((line) => !isSkillLine(line) || known.has(skillNameOf(line)))
  }
  if (lines.length === 0) return

  // 官方写入通道：全量 setDraft（一次 draft-changed 事务，可撤销）；内容原样空格连接为一行
  input.setDraft(lines.join(' ') + ' ')
}

// ─── 插件入口 ───────────────────────────────────────────────────────────
export function apply(ctx: RootCtx) {
  try {
    ctx.effect(() => ctx.locale.register(NS, dict), 'message-injector: dictionaries')

    // 配置作用域：预设组 + 选中状态共用命名空间（F3 全局持久化）
    const scope = ctx.settingsScope.bind<PresetConfig>({ namespace: NS })

    // F2 预设选择器：输入框左下角官方座位（conversation.input.left，additive list 槽）
    ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
      name: 'conversation.input.left',
      id: 'message-injector-preset-selector',
      order: 100,
      locale: NS,
      inject: () => ({ scope }),
    }, PresetSelector))

    // F1 配置卡：设置 → 插件 → 插件配置（key 必须等于后端注册的命名空间）
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
      name: 'settings.plugin.item',
      key: NS,
      locale: NS,
      inject: () => ({
        scope,
        fetchKnownSkillNames: () => {
          const sessionId = ctx.sessions.list.getSnapshot().current
          if (!sessionId) return Promise.resolve(null)
          return fetchKnownSkillNames(ctx, sessionId)
        },
      }),
    }, PresetConfigCard))

    // F4/F5 自动注入轮询（500ms，用户拍板的实现方案）
    ctx.effect(() => {
      const timer = setInterval(() => { void tick(ctx, scope) }, 500)
      return () => clearInterval(timer)
    }, 'message-injector: auto-inject polling')
  } catch (e) {
    console.error('[dsh-message-injector] client apply FAILED:', e)
    throw e
  }
}
