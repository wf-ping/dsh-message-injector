# Architecture

## Frontend + backend

> dsh officially calls the two parts **host half / client half** — in essence they are the **backend / frontend**: the backend runs inside the dsh server process (config schema, validation, persistence), the frontend runs in the browser (button, form, auto-fill). This documentation uses "frontend/backend".

## Directory layout

```
dsh-message-injector/
├── package.json            # plugin identity: dsh.bundle (activation) + dsh.client (frontend) + exports["./client"]
├── src/                             # split by the official halves: host (backend) / client (frontend)
│   ├── host/
│   │   └── index.ts            # backend source: Config schema + settings wiring + validate
│   ├── shared/
│   │   └── types.ts            # domain types PresetGroup/PresetConfig (shared by both halves; types only)
│   └── client/                 # frontend source (all browser code; built to lib/client.js)
│       ├── index.tsx           # frontend entry (composition root: wiring only)
│       ├── types/              # contract types (ScopeLike/InputLike/RootCtx defensive service types)
│       ├── api/                # data access (skills.ts: skill catalog + 30s TTL cache)
│       ├── services/           # business services (injector.ts: auto-inject polling, F4/F5)
│       ├── logic/              # pure business logic (normalizeContent/isSkillLine/skillNameOf/cloneGroup)
│       ├── locales/            # dictionaries (zh/en)
│       ├── utils/              # generic utils (scroll/css/signal/settings)
│       ├── components/         # UI components (ConfigCard/PresetSelector/PresetConfigCard)
│       └── ambient.d.ts        # minimal type stubs (react / primitives provided by the browser runtime)
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
pnpm install          # install dependencies (schemastery / esbuild / typescript)
pnpm build            # build → lib/index.js + lib/client.js
pnpm typecheck        # tsc --noEmit type check
```

> This plugin is the **first third-party caller of the `setDraft` input-write channel** (no precedent in the dsh codebase). The channel is a public official API, but testing should focus on the inject behavior.

## Key mechanisms (verified during development)

- **UI injection**: `ctx.slots.inject('conversation.input.left', ...)` registers a list-slot component (the official seat at the bottom-left of the composer); the config card goes through `plugins.row.config` (keyed slot, key = `<package>#<row id>`, i.e. `dsh-message-injector#dsh-message-injector`), rendered inside the sidebar Plugins page's row configuration
- **Config card look**: replicates the official dsh config card shell (collapsible header + form body + discard/save footer), abstracted into the **generic component `src/client/components/ConfigCard.tsx`** — props: title/description/children/dirty/saving/invalid/failed/onSave/onDiscard plus the `expandSignal` (pending consume + live subscribe) and auto-reveal after signal expansion; the field style classes (psi-field/input/textarea/check etc.) are injected with the component's CSS for children to use. Visual parameters match the official cards (radius 12 / border l2 / bg layer-3 / input 34px), all through `--dsw-alias-*` tokens with our own class names; **never reference dsh's internal CSS class names** (build hashes — they break on every upgrade; see pitfall 7 in the Chinese dev-notes doc)
- **Scroll control**: generic module `src/client/utils/scroll.ts` — `scrollElementIntoView` (aligns an element within its nearest scrollable container; start/center/nearest) plus the `useReveal(open, when)` hook (one-shot signal-driven reveal; manual actions never scroll). Both the new-group reveal and the settings-shortcut card reveal reuse it
- **CSS injection**: generic util `src/client/utils/css.ts` `injectStyle(tagId, css)` (data-plugin-css mechanism; injected once per tagId). Config-card styles are injected by the ConfigCard component; selector/group styles by their own components
- **Frontend layering**: the entry `index.tsx` only wires things up (composition root); UI components (components/), data access (api/), business services (services/), pure logic (logic/), dictionaries (locales/), and generic utils (utils/) each live in their own directory. The settings-shortcut signal uses the one-shot signal from `utils/signal.ts`; plugin-page navigation uses `openPluginPage` from `utils/settings.ts`, and the form adapter lives in `utils/form.ts`
- **Plugin page shortcut**: the 「Configure」 item at the bottom of the selector menu → module-level expand signal (immediate if the card is mounted; otherwise pending and consumed on mount) + `pluginNavigation.openBundle` to switch to this plugin's page; degrades silently when the service is absent
- **Input read/write**: official channel `input.setDraft(text)` (`conversation.input.for(actx)`; the composer is a React controlled component — never touch the DOM directly); emptiness is read via `input.state.getSnapshot()` (draft/phase)
- **Config persistence** (since dsh 0.2): the backend only exports the `Config` schema (editable fields must be `.volatile()`; namespace = loader entry id `dsh-message-injector`), and the frontend reads/writes it with `ctx.configForms.get(ENTRY_ID)` (`mutate` path writes, synced across tabs); dsh persists writes into the profile patch layer
- **Where the config page lives**: the backend calls `ctx.settings.configure({ auto: false })` to suppress the generated page; the plugin's own card registers into `plugins.row.config`, and `ctx.configForms.whileServed([ENTRY_ID], ...)` keeps it absent when the Host serves no such namespace
- **Plugin page shortcut**: `ctx.reflect.get('pluginNavigation').openBundle(packageName)` (reflect service provided by dsh-client-ui-plugin-manager) replaces the old aria/label DOM probing
- **Skill validation**: `connection.api.skills.list({sessionId})` validates `/`-prefixed skill-invocation lines (requires a session; without one the check is unavailable → those lines are injected as configured)

## Gotchas

- `useSyncExternalStore` must wrap `scope.getSnapshot/subscribe` in arrow functions, otherwise `this` is lost and rendering crashes (settings scope methods depend on `this.store`)
- The frontend must be **pre-built** as plain JS (the browser has no TS compiler); the artifact uses the `window.__ModuleLoader__.load({id, factory})` form
- A plugin must declare `dsh.bundle` in package.json, otherwise `dsh plugin add` installs it as a plain dependency and it never activates
- dsh's internal CSS class names are build hashes (e.g. `YyYd_a_card`); referencing them breaks silently on every dsh upgrade — trust only the `--dsw-alias-*` design tokens (pitfall 7 in the Chinese dev-notes doc)
- The dsh settings panel has no public open/navigate API (the open state and section `activeId` are internal component state) — locate via official aria attributes and nav labels, and make every step degradable (pitfall 8)

## Official references

- dsh plugin development tutorial: https://deepseek-harness.github.io/deepseek-harness/develop/basic/
