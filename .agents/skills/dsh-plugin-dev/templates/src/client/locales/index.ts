/**
 * locales（文案词典目录），由入口注册到 ctx.locale（命名空间见入口的 NS）
 */
export const dict: Record<string, Record<string, string>> = {
  zh: { count: '计数', desc: '示例配置卡', save: '保存', discard: '放弃' },
  en: { count: 'Count', desc: 'Example config card', save: 'Save', discard: 'Discard' },
}
