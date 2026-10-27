/**
 * 自动注入（F4）+ 注入守卫（F5）：500ms 轮询
 *
 * 会话 id 的来源：会话作用域槽位（conversation.input.left）的 inject face 会收到 sessionId，
 * 由入口记录最新值传进来。dsh 0.2 的 sessions.list 快照里已没有 `current` 字段，
 * 只有槽位给的 sessionId 才是可靠来源。
 *
 * startAutoInject 启动轮询并返回 dispose（配合 ctx.effect 使用，卸载自动清理）。
 */
import type { InputLike, RootCtx, ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'
import { isSkillLine, normalizeContent, skillNameOf } from '../logic'
import { fetchKnownSkillNames } from '../api/skills'

/**
 * 启动自动注入。
 *
 * 双通道：500ms 轮询兜底 + 输入状态订阅（草稿一变立刻判断，删空后立即反选，无 500ms 延迟）。
 * @returns 停止函数（清定时器 + 退订）
 */
export function startAutoInject(
  ctx: RootCtx,
  scope: ScopeLike<PresetConfig>,
  currentSessionId: () => string | undefined,
): () => void {
  const timer = setInterval(() => { void tick(ctx, scope, currentSessionId) }, 500)
  return () => {
    clearInterval(timer)
    unsubscribe?.()
    unsubscribe = undefined
    subscribedInput = undefined
  }
}

/** 当前已订阅的输入句柄与其退订函数（同一时间只订一个会话） */
let subscribedInput: InputLike | undefined
let unsubscribe: (() => void) | undefined

/**
 * 订阅输入状态：草稿一变立即跑一轮（删空反选要即时）。
 * @param input 会话输入门面
 */
function ensureSubscribed(input: InputLike, rerun: () => void): void {
  if (subscribedInput === input) return
  unsubscribe?.()
  subscribedInput = input
  const state = input.state as unknown as { subscribe?: (listener: () => void) => () => void }
  const off = state.subscribe?.(() => rerun())
  unsubscribe = typeof off === 'function' ? off : undefined
}

// 每类原因只报一次，避免 500ms 刷屏
const reported = new Set<string>()
const report = (message: string, detail?: unknown) => {
  if (reported.has(message)) return
  reported.add(message)
  console.warn('[dsh-message-injector] inject skipped:', message, detail ?? '')
}

/**
 * 注入节流状态：一次「选中 + 会话」只自动填一次。
 *
 * 规则（用户定的行为）：
 *  - 选中预设 / 切换会话 / 消息发送完成 → 重新允许填充（armed = true）
 *  - 自动填过一次 → armed = false
 *  - 用户手动把输入框删空（draft 空且 armed=false）→ 不再填，直到上面的事件再次发生
 */
let armed = true
let armedKey = ''
let lastPhase = 'plain'
const loggedKeys = new Set<string>()

/** 显式重新武装（用户在菜单里选了一次预设，无论值是否变化） */
export function armInjection(): void {
  armed = true
}

async function tick(ctx: RootCtx, scope: ScopeLike<PresetConfig>, currentSessionId: () => string | undefined) {
  try {
    const snap = scope.getSnapshot()
    if (snap.status !== 'ready' || !snap.value) {
      report('config not ready', { status: snap.status, hasValue: snap.value !== undefined })
      return
    }
    const { groups, selected } = snap.value
    if (selected === '') {
      report('nothing selected', { groups: groups.length })
      return
    }
    const group = groups.find((g) => g.name === selected)
    if (!group || !group.enabled) {
      report('selected group missing or disabled', { selected })
      return
    }

    const sessionId = currentSessionId()
    if (!sessionId) {
      report('no session id from the composer slot yet')
      return
    }

    // sessions 服务按需取（不写进 cordis inject，服务缺失时只是不注入）
    const sessions = (ctx.get('sessions') ?? ctx.reflect.get('sessions')) as RootCtx['sessions'] | undefined
    if (!sessions) {
      report('sessions service unavailable')
      return
    }
    const actx = sessions.scope(sessionId)
    if (!actx) {
      report('session scope missing', { sessionId })
      return
    }
    const conversation = actx.get('conversation') as { input?: { for(a: unknown): InputLike } } | undefined
    const input = conversation?.input?.for(actx)
    if (!input) {
      report('conversation input unavailable', { sessionId })
      return
    }

    ensureSubscribed(input, () => { void tick(ctx, scope, currentSessionId) })
    const s = input.state.getSnapshot()

    // 选中项或会话变了 → 重新允许填充
    const key = `${sessionId}|${selected}`
    if (key !== armedKey) {
      armedKey = key
      armed = true
      console.info('[dsh-message-injector] armed for', key)
    }
    // 提交结束（非 plain → plain）说明消息发出去了，下一条消息可以再填
    if (lastPhase !== 'plain' && s.phase === 'plain') armed = true
    lastPhase = s.phase

    // 守卫 1：非 plain 相位（提交中/忙态）不注入
    if (s.phase !== 'plain') {
      report('phase not plain', { phase: s.phase })
      return
    }
    // 守卫 2：输入框去掉空白后非空 → 不注入（保护已有内容）
    if (typeof s.draft !== 'string') {
      report('input state has no draft string', { keys: Object.keys(s) })
      return
    }
    if (s.draft.trim() !== '') return
    // 用户手动删空（已填过一次）→ 不再回填，并且直接取消选中
    if (!armed) {
      if (!loggedKeys.has(key)) {
        loggedKeys.add(key)
        console.info('[dsh-message-injector] manual clear detected, deselect preset:', key)
      }
      try {
        await scope.set('selected', '')
      } catch {
        // 写失败也无妨：本轮的 armed=false 已经拦住回填
      }
      return
    }
    // 守卫 3：编辑器里已有未同步到 state 的文本 → 跳过
    if (typeof document !== 'undefined') {
      const editor = document.querySelector<HTMLElement>('[data-composer-card] [contenteditable="true"]')
      const text = editor?.textContent ?? ''
      if (text.trim() !== '') {
        report('editor has unsynced text', { text: text.slice(0, 40), foundEditor: editor !== null })
        return
      }
    }

    let lines = normalizeContent(group.content)
    if (lines.length === 0) {
      report('group content empty', { group: group.name })
      return
    }
    // F6-1 运行期保守：技能调用行（/ 开头）校验存在性，缺失跳过；普通文本原样注入
    const known = await fetchKnownSkillNames(ctx, sessionId)
    if (known) {
      const before = lines.length
      lines = lines.filter((line) => !isSkillLine(line) || known.has(skillNameOf(line)))
      if (lines.length !== before) {
        report('some skill lines filtered as missing', { before, after: lines.length, known: [...known].slice(0, 10) })
      }
    }
    if (lines.length === 0) {
      report('no lines left after skill filtering', { content: group.content })
      return
    }

    // 官方写入通道：全量 setDraft（一次 draft-changed 事务，可撤销）；内容原样空格连接为一行
    const text = lines.join(' ') + ' '
    armed = false
    input.setDraft(text)
    if (!reported.has('done')) {
      reported.add('done')
      console.info('[dsh-message-injector] injected:', text.slice(0, 40))
    }
  } catch (error) {
    report('tick failed', error)
  }
}
