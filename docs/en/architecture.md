# Architecture

## Frontend + backend

> dsh officially calls the two parts **host half / client half** — in essence they are the **backend / frontend**: the backend runs inside the dsh server process (config schema, validation, persistence), the frontend runs in the browser (button, form, auto-fill). This documentation uses "frontend/backend".

## Directory layout

```
dsh-message-injector/
├── package.json            # plugin identity: dsh.bundle (activation) + dsh.client (frontend) + exports["./client"]
├── src/
│   ├── index.ts            # backend source: Config schema + settings wiring + validate
│   ├── client.tsx          # frontend source (JSX; built to lib/client.js)
│   ├── components/
│   │   └── ConfigCard.tsx  # generic config-card component (official shell: collapsible header + form body + discard/save footer + expand signal)
│   ├── utils/
│   │   ├── scroll.ts       # generic scroll utils (findScrollContainer / scrollElementIntoView / useReveal)
│   │   └── css.ts          # CSS injection util (injectStyle, data-plugin-css mechanism)
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

> This plugin is the **first third-party caller of the `setDraft` input-write channel** (no precedent in the dsh codebase). The channel is a public official API, but testing should focus on the inject behavior.

## Key mechanisms (verified during development)

- **UI injection**: `ctx.slots.inject('conversation.input.left', ...)` registers a list-slot component (the official seat at the bottom-left of the composer); the config card goes through `settings.plugin.item` (key = namespace `message-injector`)
- **Config card look**: replicates the official dsh config card shell (collapsible header + form body + discard/save footer), abstracted into the **generic component `src/components/ConfigCard.tsx`** — props: title/description/children/dirty/saving/invalid/failed/onSave/onDiscard plus the `expandSignal` (pending consume + live subscribe) and auto-reveal after signal expansion; the field style classes (psi-field/input/textarea/check etc.) are injected with the component's CSS for children to use. Visual parameters match the official cards (radius 12 / border l2 / bg layer-3 / input 34px), all through `--dsw-alias-*` tokens with our own class names; **never reference dsh's internal CSS class names** (build hashes — they break on every upgrade; see pitfall 7 in the Chinese dev-notes doc)
- **Scroll control**: generic module `src/utils/scroll.ts` — `scrollElementIntoView` (aligns an element within its nearest scrollable container; start/center/nearest) plus the `useReveal(open, when)` hook (one-shot signal-driven reveal; manual actions never scroll). Both the new-group reveal and the settings-shortcut card reveal reuse it
- **CSS injection**: generic util `src/utils/css.ts` `injectStyle(tagId, css)` (data-plugin-css mechanism; injected once per tagId). Config-card styles are injected by the ConfigCard component; selector/group styles by client.tsx
- **Settings shortcut**: the 「Settings」 item at the bottom of the selector menu → module-level expand signal (immediate if the card is mounted; otherwise pending and consumed on mount) + official aria attribute to locate the settings trigger (`button[aria-haspopup="dialog"]`) + official nav label to locate the Plugins section (`插件`/`Plugins`, retried 100ms×15 while the panel renders); every step degrades gracefully (see pitfall 8)
- **Input read/write**: official channel `input.setDraft(text)` (`conversation.input.for(actx)`; the composer is a React controlled component — never touch the DOM directly); emptiness is read via `input.state.getSnapshot()` (draft/phase)
- **Config persistence**: backend `installSettingsSection` registers the namespace; frontend `ctx.settingsScope.bind({namespace})` reads/writes it (synced across tabs)
- **Skill validation**: `connection.api.skills.list({sessionId})` validates `/`-prefixed skill-invocation lines (requires a session; without one the check is unavailable → those lines are injected as configured)

## Gotchas

- `useSyncExternalStore` must wrap `scope.getSnapshot/subscribe` in arrow functions, otherwise `this` is lost and rendering crashes (settings scope methods depend on `this.store`)
- The frontend must be **pre-built** as plain JS (the browser has no TS compiler); the artifact uses the `window.__ModuleLoader__.load({id, factory})` form
- A plugin must declare `dsh.bundle` in package.json, otherwise `dsh plugin add` installs it as a plain dependency and it never activates
- dsh's internal CSS class names are build hashes (e.g. `YyYd_a_card`); referencing them breaks silently on every dsh upgrade — trust only the `--dsw-alias-*` design tokens (pitfall 7 in the Chinese dev-notes doc)
- The dsh settings panel has no public open/navigate API (the open state and section `activeId` are internal component state) — locate via official aria attributes and nav labels, and make every step degradable (pitfall 8)

## Official references

- dsh plugin development tutorial: https://deepseek-harness.github.io/deepseek-harness/develop/basic/
