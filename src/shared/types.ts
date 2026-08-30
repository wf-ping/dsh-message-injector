/**
 * 领域类型（host 后端与 client 前端共用；纯类型，无运行时）
 *
 * 与后端 Config schema 结构对齐（src/host/index.ts）；前端备份一份是为了
 * 避免对后端模块的强类型依赖，类型定义唯一来源在本文件。
 */

/** 单个预设组 */
export interface PresetGroup {
  /** 组名：必填、唯一 */
  name: string
  /** 描述：可选，备注用途 */
  description: string
  /** 注入内容：任意文本，每行一条；以 / 开头的行视为技能调用（如 /grill-me） */
  content: string[]
  /** 启用：默认开启；禁用组不出现在选择器菜单 */
  enabled: boolean
}

/** 插件配置（与后端 Config schema 结构一致） */
export interface PresetConfig {
  groups: PresetGroup[]
  /** 当前选中组名称；空字符串 = 未选中（F3） */
  selected: string
}
