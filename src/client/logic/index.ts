/**
 * 领域纯逻辑（无 React、无 DOM、无副作用）
 */
import type { PresetConfig, PresetGroup } from '../../shared/types'

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

/**
 * 合并旧 localStorage 配置与宿主配置（首次迁移用，避免任何一边的数据丢失）。
 * 同名组以宿主为准（宿主已是唯一可信源）；旧数据里宿主没有的组补进去。
 * 选中项：旧选中仍有效则保留（用户眼前的 UI 状态），否则用宿主的。
 */
export function mergePresetConfig(local: PresetConfig, host: PresetConfig): PresetConfig {
  const byName = new Map<string, PresetGroup>()
  for (const group of host.groups) byName.set(group.name, cloneGroup(group))
  for (const group of local.groups) {
    if (!byName.has(group.name)) byName.set(group.name, cloneGroup(group))
  }
  const groups = [...byName.values()]
  const names = new Set(groups.map((group) => group.name))
  const selected = names.has(local.selected)
    ? local.selected
    : (names.has(host.selected) ? host.selected : '')
  return { groups, selected }
}
