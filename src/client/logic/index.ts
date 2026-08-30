/**
 * 领域纯逻辑（无 React、无 DOM、无副作用）
 */
import type { PresetGroup } from '../../shared/types'

/** 内容归一化：去空白、去空行、去重（保持原样，不做 / 处理） */
export function normalizeContent(raw: string[]): string[] {
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
export function isSkillLine(line: string): boolean {
  return line.startsWith('/') && line.length > 1
}

/** 技能调用行 → 技能名（去掉前导 /） */
export function skillNameOf(line: string): string {
  return line.replace(/^\//, '')
}

/** 深拷贝一个预设组（草稿编辑用，避免污染外部状态） */
export function cloneGroup(g: PresetGroup): PresetGroup {
  return { name: g.name, description: g.description, content: [...g.content], enabled: g.enabled }
}
