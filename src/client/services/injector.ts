/**
 * 自动注入（F4）+ 注入守卫（F5）：500ms 轮询
 *
 * startAutoInject 启动轮询并返回 dispose（配合 ctx.effect 使用，卸载自动清理）。
 */
import type { InputLike, RootCtx, ScopeLike } from '../types'
import type { PresetConfig } from '../../shared/types'
import { isSkillLine, normalizeContent, skillNameOf } from '../logic'
import { fetchKnownSkillNames } from '../api/skills'

/** 启动 500ms 自动注入轮询；返回停止函数 */
export function startAutoInject(ctx: RootCtx, scope: ScopeLike<PresetConfig>): () => void {
  const timer = setInterval(() => { void tick(ctx, scope) }, 500)
  return () => clearInterval(timer)
}

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
