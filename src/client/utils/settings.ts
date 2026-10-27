/**
 * 插件页定位（选择器菜单「配置」直达）
 *
 * dsh 0.2 起插件配置页在侧边栏「插件」面板里：包 → 行 → 配置。
 * 插件页对外提供一个反射服务 `pluginNavigation`（dsh-client-ui-plugin-manager 注册）：
 *   ctx.reflect.get('pluginNavigation').openBundle(packageName)
 * 用它打开本包页面；服务不存在（未组合插件页）时静默返回，由用户自行导航。
 */
import type { RootCtx } from '../types'

/** 插件页导航服务形状 */
interface PluginNavigation {
  openBundle(packageName: string): void
}

/**
 * 打开指定包的插件页。
 * @param ctx 客户端根上下文
 * @param packageName 包名（如 dsh-message-injector）
 */
export function openPluginPage(ctx: RootCtx, packageName: string): void {
  try {
    const nav = ctx.reflect.get('pluginNavigation') as PluginNavigation | undefined
    nav?.openBundle(packageName)
  } catch {
    // 优雅降级：没有插件页导航就什么都不做
  }
}
