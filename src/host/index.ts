/**
 * dsh-message-injector — 后端（dsh 官方称 Host half）
 *
 * 职责：
 *  - 声明插件 Config schema（预设组列表 + 当前选中组）；dsh 0.2 起配置表单由
 *    schema 自动投影，命名空间 = loader 条目 id（本包 bundle.patch.yml 的
 *    `dsh-message-injector`），字段必须 `.volatile()` 才允许用户在界面里改（F3）
 *  - 关闭「自动生成配置页」（auto: false）：本插件自带配置卡，注册在插件页的
 *    行配置槽（plugins.row.config，F1）
 *
 * 需求：docs/zh/需求.md（F1 / F3 / F6）
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

/** 领域类型（唯一来源 src/shared/types.ts；此处 re-export 保持对外接口不变） */
export type { PresetGroup, PresetConfig } from '../shared/types'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** dsh-settings 提供的配置表单服务（SettingsForms） */
    settings: {
      /**
       * 登记本插件实例的配置页策略。
       * @param presentation - `auto: false` 表示不生成自动配置页
       * @param owner - 策略归属的插件实例（默认当前 fiber）
       * @returns 注销函数
       */
      configure(presentation: { auto?: boolean }, owner?: unknown): () => void
    }
  }
}

export const name = 'dsh-message-injector'

const presetGroupSchema = z.object({
  name: z.string().required(),
  description: z.string().default(''),
  content: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
})

export const Config = z.object({
  groups: z.array(presetGroupSchema).default([]).volatile(),
  /** 当前选中组名称；空字符串 = 未选中（F3） */
  selected: z.string().default('').volatile(),
})

export function apply(ctx: Context) {
  // 配置界面由本插件自带的配置卡承担，声明后 dsh 不再生成自动配置页
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
}
