/**
 * dsh-message-injector — 后端（dsh 官方称 Host half）
 *
 * 本插件是纯前端插件：预设组与选中状态存在浏览器 localStorage，
 * 注入靠前端的 input.setDraft，因此后端不需要 Config schema，也不注册配置页。
 * 保留这个入口是为了 dsh 的 bundle 加载（package.json 的 main）。
 */
import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-message-injector'

export function apply(_ctx: Context) {
  // 无后端行为：见文件头说明
}
