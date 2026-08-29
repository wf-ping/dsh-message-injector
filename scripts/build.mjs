/**
 * 构建插件两个半区（产物提交在 lib/，安装即用，无需用户构建）：
 *   1. Host 半区  ：src/index.ts  → lib/index.js   （ESM；schemastery/dsh-settings 保持外部解析）
 *   2. 客户端半区 ：src/client.tsx → lib/client.js （__ModuleLoader__.load 形态，浏览器半区标准格式）
 *
 * 用法：pnpm build
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'

// ─── 1. Host 半区 ───────────────────────────────────────────────────────
const host = await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: ['@deepseek-ai/schemastery', '@deepseek-ai/dsh-settings'],
  write: false,
  logLevel: 'info',
})
mkdirSync('lib', { recursive: true })
writeFileSync('lib/index.js', host.outputFiles[0].text)
console.log('built lib/index.js (' + host.outputFiles[0].text.length + ' bytes)')

// ─── 2. 客户端半区 ──────────────────────────────────────────────────────
const external = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/dsh-client-ui-primitives',
]
const client = await build({
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

const code = client.outputFiles[0].text
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

writeFileSync('lib/client.js', wrapped)
console.log('built lib/client.js (' + wrapped.length + ' bytes)')
