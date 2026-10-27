/**
 * dsh-message-injector — 后端（dsh 官方称 Host half）
 *
 * 预设组与选中状态存在 dsh 配置系统里（settings 命名空间 = 本插件在 profile 里的
 * 条目 id `dsh-message-injector`），落盘到当前 profile 的 cordis.patch.yml。
 * 因此终端 `dsh web` 与 VS Code 面板共享同一份数据：配置在宿主侧，不依赖浏览器
 * origin（旧版本存在 localStorage，按 origin 隔离，两个入口各存一份）。
 *
 * 只有标了 `.volatile()` 的字段才会被 settings 暴露成可写表单（dsh-settings 的
 * 规则：表单只投影 volatile 字段），所以两个字段都必须 volatile。
 */
import z from '@deepseek-ai/schemastery'
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-message-injector'

/** 单个预设组的配置形状（与 src/shared/types.ts 的 PresetGroup 对齐） */
const GroupSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  content: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

export const Config = z.object({
  /** 预设组列表；前端整组读写（一次 mutate 写整个数组） */
  groups: z.array(GroupSchema).default([]).volatile(),
  /** 当前选中组名称；空字符串 = 未选中 */
  selected: z.string().default('').volatile(),
})

export function apply(_ctx: Context) {
  // 无后端行为：配置由 dsh-settings 读写，注入在前端完成。
}
