/**
 * 内联图标（自有 SVG，零 primitives 图标依赖）
 *
 * dsh 0.2 起 primitives 的图标命名整体换过（`IconXxxOutline14/16` → `IconXxxOutlineRegular/Medium`），
 * 引用旧名会拿到 undefined 组件 → 渲染崩溃、槽位整块不显示。为免再次被改名波及，
 * 本插件只保留对 `Menu` 的依赖，图标全部自带（currentColor 描边，随主题共变）。
 */

interface IconProps {
  className?: string
}

/** 通用 svg 壳 */
function Icon({ className, children }: IconProps & { children?: unknown }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** 向下箭头（选择器 / 组折叠） */
export function ChevronDownIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M4 6.5 8 10.5 12 6.5" /></Icon>
}

/** 向上箭头（组上移） */
export function ChevronUpIcon({ className }: IconProps) {
  return <Icon className={className}><path d="M4 9.5 8 5.5 12 9.5" /></Icon>
}

/** 垃圾桶（删除组） */
export function TrashIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2h5.8l.6-8.2M6.8 7v3.2M9.2 7v3.2" />
    </Icon>
  )
}

/** 齿轮（菜单底部「配置」） */
export function SettingsIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 2v1.6M8 12.4V14M2 8h1.6M12.4 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1" />
    </Icon>
  )
}

/** 四角星（预设 / 技能标记） */
export function SkillIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M8 2.5 9.4 6.6 13.5 8 9.4 9.4 8 13.5 6.6 9.4 2.5 8 6.6 6.6Z" />
    </Icon>
  )
}
