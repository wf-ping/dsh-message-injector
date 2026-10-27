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

/** 启动 500ms 自动注入轮询；返回停止函数 */
export function startAutoInject(
  ctx: RootCtx,
  scope: ScopeLike<PresetConfig>,
  currentSessionId: () => string | undefined,
): () => void {
  const timer = setInterval(() => { void tick(ctx, scope, currentSessionId) }, 500)
  return () => clearInterval(timer)
}

// 每类原因只报一次，避免 500ms 刷屏
const reported = new Set<string>()
const report = (message: string, detail?: unknown) => {
  if (reported.has(message)) return
  reported.add(message)
  console.warn('[dsh-message-injector] inject skipped:', message, detail ?? '')
}

async function tick(ctx: RootCtx, scope: ScopeLike<PresetConfig>, currentSessionId: () => string | undefined) {
  try {
    const snap = scope.getSnapshot()
    if (snap.status !== 'ready' || !snap.value) return
    const { groups, selected } = snap.value
    if (selected === '') return
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

    const s = input.state.getSnapshot()
    // 守卫 1：非 plain 相位（提交中/忙态）不注入
    if (s.phase !== 'plain') return
    // 守卫 2：输入框去掉空白后非空 → 不注入（保护已有内容）
    if (typeof s.draft !== 'string' || s.draft.trim() !== '') return
    // 守卫 3：编辑器里已有未同步到 state 的文本 → 跳过
    if (typeof document !== 'undefined') {
      const editor = document.querySelector<HTMLElement>('[data-composer-card] [contenteditable="true"]')
      const text = editor?.textContent ?? ''
      if (text.trim() !== '') return
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
  } catch (error) {
    report('tick failed', error)
  }
}
