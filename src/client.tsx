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
import { Menu, IconSkillOutline16, IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'

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
    empty: '暂无已启用的预设组',
    groupName: '组名',
    description: '描述',
    content: '内容（每行一条）',
    enabled: '启用',
    addGroup: '添加预设组',
    save: '保存',
    reset: '重置',
    remove: '删除',
    moveUp: '上移',
    moveDown: '下移',
    missingSkills: '以下技能不存在，注入时将跳过：',
    saveFailed: '保存失败',
    nameRequired: '组名不能为空',
    nameDuplicate: '组名重复',
    contentRequired: '内容列表不能为空',
    contentHint: '以 / 开头的行视为技能调用并校验存在性（缺失时注入跳过）；其余内容原样注入到每条消息',
    errorHint: '出错请检查输入后重试',
  },
  en: {
    preset: 'Preset',
    selectPreset: 'Select a preset group',
    empty: 'No enabled preset groups',
    groupName: 'Name',
    description: 'Description',
    content: 'Content (one per line)',
    enabled: 'Enabled',
    addGroup: 'Add preset group',
    save: 'Save',
    reset: 'Reset',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    missingSkills: 'Missing skills, skipped when injecting: ',
    saveFailed: 'Save failed',
    nameRequired: 'Name is required',
    nameDuplicate: 'Duplicate name',
    contentRequired: 'At least one content line is required',
    contentHint: 'Lines starting with / are treated as skill invocations and validated (missing skills are skipped); other content is injected verbatim into every message',
    errorHint: 'Check the input and retry',
  },
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
.psi-card{display:flex;flex-direction:column;gap:12px;padding:4px 0 8px}
.psi-group{display:flex;flex-direction:column;gap:6px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px}
.psi-row{display:flex;align-items:center;gap:8px}
.psi-input{flex:1;min-width:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 8px;font-size:13px;line-height:20px}
.psi-textarea{flex:1;min-width:0;min-height:64px;resize:vertical;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 8px;font-size:13px;line-height:20px;font-family:inherit}
.psi-icon-btn{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px;padding:4px;display:inline-flex;align-items:center}
.psi-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.psi-icon-btn:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.psi-check{accent-color:var(--dsw-alias-label-secondary)}
.psi-label{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:16px}
.psi-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:16px}
.psi-warn{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-caption));font-size:12px;line-height:16px}
.psi-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:16px}
.psi-actions{display:flex;gap:8px;align-items:center}
.psi-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary);border:none;border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer}
.psi-primary:hover{background:var(--dsw-alias-button-primary-hover)}
.psi-primary:disabled{opacity:.5;cursor:default}
.psi-ghost{background:0 0;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer}
.psi-ghost:hover{background:var(--dsw-alias-interactive-bg-hover)}
`

function injectStyle(tagId: string, css: string) {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-message-injector'
  tag.dataset.pluginCss = tagId
  tag.textContent = css
  document.head.appendChild(tag)
}
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
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // scope 就绪且用户未编辑时，同步外部配置（多标签页/外部修改）
  useEffect(() => {
    if (dirty) return
    if (snap.status === 'ready' && snap.value) {
      setDraft(snap.value.groups.map(cloneGroup))
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
  }

  const removeGroup = (i: number) => markDirty(draft.filter((_, j) => j !== i))

  const addGroup = () => markDirty([...draft, { name: '', description: '', content: [], enabled: true }])

  const reset = () => {
    const s = scope.getSnapshot()
    setDraft((s.status === 'ready' ? s.value?.groups ?? [] : []).map(cloneGroup))
    setDirty(false)
    setError('')
  }

  const save = async () => {
    setError('')
    const cleaned = draft.map((g) => ({
      name: g.name.trim(),
      description: g.description.trim(),
      content: normalizeContent(g.content),
      enabled: g.enabled,
    }))
    // 本地硬校验（与后端 validate 一致，提前反馈）
    const seen = new Set<string>()
    for (const g of cleaned) {
      if (g.name === '') { setError(t('nameRequired')); return }
      if (seen.has(g.name)) { setError(`${t('nameDuplicate')}：${g.name}`); return }
      seen.add(g.name)
      if (g.content.length === 0) { setError(`${t('contentRequired')}：${g.name}`); return }
    }
    setSaving(true)
    try {
      await scope.set('groups', cleaned)
      setDraft(cleaned.map(cloneGroup))
      setDirty(false)
    } catch (e) {
      setError(t('saveFailed') + (e instanceof Error ? `：${e.message}` : `：${t('errorHint')}`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="psi-card">
      {draft.length === 0 && (
        <div className="psi-hint">{t('empty')}</div>
      )}
      {draft.map((g, i) => {
        const missing = knownSkills
          ? g.content
            .map((line) => line.trim())
            .filter((line) => isSkillLine(line) && !knownSkills.has(skillNameOf(line)))
          : []
        return (
          <div key={i} className="psi-group">
            <div className="psi-row">
              <input
                className="psi-input"
                value={g.name}
                placeholder={t('groupName')}
                onChange={(e: { target: { value: string } }) => patch(i, { name: e.target.value })}
              />
              <label className="psi-label">
                <input
                  type="checkbox"
                  className="psi-check"
                  checked={g.enabled}
                  onChange={(e: { target: { checked: boolean } }) => patch(i, { enabled: e.target.checked })}
                />
                {' '}{t('enabled')}
              </label>
            </div>
            <div className="psi-row">
              <input
                className="psi-input"
                value={g.description}
                placeholder={t('description')}
                onChange={(e: { target: { value: string } }) => patch(i, { description: e.target.value })}
              />
            </div>
            <div className="psi-row">
              <textarea
                className="psi-textarea"
                value={g.content.join('\n')}
                placeholder={t('content')}
                onChange={(e: { target: { value: string } }) => patch(i, { content: e.target.value.split('\n') })}
              />
            </div>
            {missing.length > 0 && (
              <div className="psi-warn">{t('missingSkills')}{missing.join(', ')}</div>
            )}
            <div className="psi-row">
              <button type="button" className="psi-icon-btn" title={t('moveUp')} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="psi-icon-btn" title={t('moveDown')} disabled={i === draft.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="psi-icon-btn" title={t('remove')} onClick={() => removeGroup(i)}>✕</button>
            </div>
          </div>
        )
      })}
      <div className="psi-actions">
        <button type="button" className="psi-ghost" onClick={addGroup}>+ {t('addGroup')}</button>
        <span style={{ flex: 1 }} />
        <button type="button" className="psi-ghost" onClick={reset} disabled={saving}>{t('reset')}</button>
        <button type="button" className="psi-primary" onClick={() => void save()} disabled={saving}>
          {saving ? '…' : t('save')}
        </button>
      </div>
      {error !== '' && <div className="psi-error">{error}</div>}
      <div className="psi-hint">{t('contentHint')}</div>
    </div>
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
