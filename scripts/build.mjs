/**
 * 构建客户端半区：src/client.ts → lib/client.js
 *
 * 产出为 dsh 浏览器半区标准形态：
 *   window.__ModuleLoader__.load({ id, factory })  —— factory 内是 esbuild 打包后的 CJS 代码，
 *   require() 仅指向浏览器运行时提供的模块（react / react/jsx-runtime / @deepseek-ai/dsh-client-ui-primitives）。
 *
 * 用法：pnpm build   （dsh 的 HMR 监视 lib/client.js，重新构建后浏览器免刷新热更）
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'

const external = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/dsh-client-ui-primitives',
]

const result = await build({
  entryPoints: ['src/client.tsx'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external,
  write: false,
  logLevel: 'info',
})

const code = result.outputFiles[0].text
const wrapped = `window.__ModuleLoader__.load({
\tid: "dsh-skill-injector",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${code}
\t\treturn module.exports;
\t}
});
`

mkdirSync('lib', { recursive: true })
writeFileSync('lib/client.js', wrapped)
console.log('built lib/client.js (' + wrapped.length + ' bytes)')
