# Architecture

## Frontend + backend

> dsh officially calls the two parts **host half / client half** — in essence they are the **backend / frontend**: the backend runs inside the dsh server process (config schema, validation, persistence), the frontend runs in the browser (button, form, auto-fill). This documentation uses "frontend/backend".

## Directory layout

```
dsh-skill-injector/
├── package.json            # plugin identity: dsh.bundle (activation) + dsh.client (frontend) + exports["./client"]
├── src/
│   ├── index.ts            # backend source: Config schema + settings wiring + validate
│   ├── client.tsx          # frontend source (JSX; built to lib/client.js)
│   └── ambient.d.ts        # minimal type stubs (react / primitives provided by the browser runtime)
├── scripts/build.mjs       # esbuild build (pnpm build): backend → lib/index.js, frontend → lib/client.js
├── lib/index.js            # backend build artifact (committed)
├── lib/client.js           # frontend build artifact (committed; rebuild after frontend changes)
└── docs/
    ├── zh/                 # Chinese docs
    └── en/                 # English docs
```

> The repo ships **no** `cordis.yml` / `--patch` local-load config. The plugin is installed only via the official `dsh plugin add/remove` commands.

## Building

```bash
pnpm install          # install dependencies (schemastery / dsh-settings / esbuild / typescript)
pnpm build            # build → lib/index.js + lib/client.js
pnpm typecheck        # tsc --noEmit type check
```

> This plugin is the **first third-party caller of the `setDraft` input-write channel** (no precedent in the dsh codebase). The channel is a public official API, but testing should focus on the fill behavior.

## Key mechanisms (verified during development)

- **UI injection**: `ctx.slots.inject('conversation.input.left', ...)` registers a list-slot component (the official seat after the FULL ACCESS button in the composer toolbar); the config card goes through `settings.plugin.item` (key = namespace `skill-injector`)
- **Input read/write**: official channel `input.setDraft(text)` (`conversation.input.for(actx)`; the composer is a React controlled component — never touch the DOM directly); emptiness is read via `input.state.getSnapshot()` (draft/phase)
- **Config persistence**: backend `installSettingsSection` registers the namespace; frontend `ctx.settingsScope.bind({namespace})` reads/writes it (synced across tabs)
- **Skill catalog**: `connection.api.skills.list({sessionId})` (requires a session; without one the check is unavailable → filling uses the configured skills as-is)

## Gotchas

- `useSyncExternalStore` must wrap `scope.getSnapshot/subscribe` in arrow functions, otherwise `this` is lost and rendering crashes (settings scope methods depend on `this.store`)
- The frontend must be **pre-built** as plain JS (the browser has no TS compiler); the artifact uses the `window.__ModuleLoader__.load({id, factory})` form
- A plugin must declare `dsh.bundle` in package.json, otherwise `dsh plugin add` installs it as a plain dependency and it never activates

## Official references

- dsh plugin development tutorial: https://deepseek-harness.github.io/deepseek-harness/develop/basic/
