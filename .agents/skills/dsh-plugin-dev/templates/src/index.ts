/**
 * dsh 插件后端最小入口（最小回路验证用）
 *
 * 完整功能参考：dsh-message-injector 仓库的 src/index.ts——
 *  - Config schema（schemastery）+ settings 接线（installSettingsSection/settingsNamespace）
 *  - validate 硬校验（throw 即拒绝写入）
 *  - onChange 外部变化处理
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-hello-plugin'

export function apply(ctx: Context) {
  // 最小回路验证：用户安装 + 重启 dsh 后，终端应打印此行
  console.log('[dsh-hello-plugin] plugin loaded!')

  // 通过 ctx 注册的资源卸载时自动清理；需手动清理的（定时器/订阅/连接）用 ctx.effect()
  // ctx.effect(() => { const t = setInterval(...); return () => clearInterval(t) })
  // 依赖其他服务用 inject 声明：export const inject = ['settings'] as const
  // 注意：ctx.logger 是服务工厂，直接 .info 静默无效（坑 6）——用 console.log
}
