/**
 * dsh-skill-injector — Host 半区（服务端）
 *
 * 职责：
 *  - 声明插件配置 schema（预设组列表 + 当前选中组），经 settings 命名空间持久化（F3 全局持久化）
 *  - 保存时硬性校验（F6：组名唯一、非空组、技能名非空）
 *  - 当前选中组被删除/禁用时自动反选（F6-6）
 *
 * 需求：docs/需求/全局.md（F1 / F3 / F6）
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'

/** 插件 settings 命名空间（Host 注册、客户端配置卡、选中状态共用） */
export const NS = settingsNamespace('skill-injector')

/** 单个预设组 */
export interface PresetGroup {
  name: string
  description: string
  skills: string[]
  enabled: boolean
}

const presetGroupSchema = z.object({
  name: z.string().required(),
  description: z.string().default(''),
  skills: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

export const Config = z.object({
  groups: z.array(presetGroupSchema).default([]),
  /** 当前选中组名称；空字符串 = 未选中（F3） */
  selected: z.string().default(''),
})

/** 插件配置（与 Config schema 结构一致；手写类型以避免对 z.infer 的依赖） */
export interface PresetConfig {
  groups: PresetGroup[]
  selected: string
}

export const name = 'dsh-skill-injector'

export function apply(ctx: Context) {
  // 配置源：settings 存在时取 live scope，否则回退组合 entry（installSettingsSection 规范接线）
  let source: () => PresetConfig = () => ({ groups: [], selected: '' })

  installSettingsSection(ctx, NS, Config, { groups: [], selected: '' }, {
    setSource(current) {
      source = current
    },
    onChange() {
      // F6-6 自动反选：当前选中组被删除或禁用 → 清除选中，恢复未选中状态
      const cfg = source()
      const target = cfg.groups.find((g) => g.name === cfg.selected)
      if (cfg.selected !== '' && (!target || !target.enabled)) {
        void ctx.get('settings')?.update(NS, { selected: '' }).catch(() => {})
      }
    },
    // F6 硬性校验（throw 即拒绝写入，wire 返回 settings-rejected）：
    // 原则「配置期宽容」——技能存在性属警告级（F6-1，客户端卡 UI 展示 ⚠️），此处不拦。
    validate(value) {
      const groups = value.groups ?? []
      const seen = new Set<string>()
      for (const group of groups) {
        const n = group.name.trim()
        if (n === '') throw new Error('预设组名称不能为空')
        if (seen.has(n)) throw new Error(`预设组名称重复：${n}`)
        seen.add(n)
        if (group.skills.length === 0) throw new Error(`预设组「${n}」的技能列表不能为空`)
        for (const s of group.skills) {
          if (s.trim() === '') throw new Error(`预设组「${n}」包含空的技能名称`)
        }
      }
    },
  })

  // 诊断日志：console.log 保证终端可见（ctx.logger 是服务工厂，直接 .info 无效）
  console.log('[dsh-skill-injector] host apply ran')
}
