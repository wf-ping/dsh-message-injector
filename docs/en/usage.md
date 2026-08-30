# Usage

## Configure preset groups

Settings → Plugins → Plugin Config → find the **「Message Injector」** card (collapsible — click the header bar to expand/collapse):

1. Click **「+ Add preset group」**: the new group is inserted **at the first position** and auto-expanded (scrolled into view)
2. Fill in the name (required, unique), description (optional), and content (one line per row: skill invocations carry a leading `/`, e.g. `/grill-me`; or plain text such as "Please answer in Chinese")
3. Groups are collapsed by default (name only); click a group name to expand it for editing. The **enabled** toggle, move up/down, and delete live in the group header row and work while collapsed
4. Click **Save** (name must be unique, at least one content line; `/`-prefixed lines whose skill does not exist are marked with ⚠️ and skipped when injecting) or **Discard**

> Quick entry: the 「Preset」 menu at the bottom-left of the composer has a **「Settings」** item — one click opens the settings panel, switches to the Plugins section, and auto-expands the config card scrolled into view (if the auto-switch fails, switch manually and the card still expands by itself).

## Select / deselect

1. Back in a conversation, a **「Preset」** button appears at the bottom-left of the composer
2. Click it → choose a preset group (you may also select none)
3. **Clicking the currently selected group again = deselect**, which stops auto-injecting

## Auto-inject

- Once a group is selected, an **empty input box** gets the content injected within ~500ms (one line, space-separated, e.g. `/grill-me /domain-modeling `)
- **Every message is auto-injected**; if the input box **already has content, nothing is injected** — existing content is never touched
- The selection persists globally: across page refreshes, dsh restarts, and browser tabs

## Usage tips

- **Short fixed content** (format requirements, fixed prefixes, e.g. "Please answer in Chinese") → put it directly in the content lines; injected on every message, simple and direct
- **Longer/complex instructions or workflows** → prefer turning them into a dsh **SKILL** and write just one `/skill-name` line in the content:
  - Reusable and versionable — no need to carry the full text on every message (saves tokens and context)
  - `/`-prefixed lines are **validated for existence**: missing skills are warned (⚠️) in the config card and skipped when injecting
  - Note: skills are **session-activated** — re-injecting the same skill on every message duplicates its full text into the context (wastes tokens). If you only need it on the first message, trigger it manually once, or wait for the "first-message-only" mode (a future idea)
- **Mixed content**: plain text and skill invocations can be mixed in one group; they are joined in order when injecting

## Typical workflow

1. **Configure**: Settings → Plugins → Plugin Config → **「+ Add preset group」** (the new group is inserted **at the first position** and auto-expanded) → fill in name/description/content (one per line) → **Save** (or Discard)
2. **Select**: click the **「Preset」** button at the bottom-left of the composer → pick a group (**clicking the current group again = deselect**, stopping injection)
3. **In effect**: an empty input box gets the content injected within ~500ms; edit freely before sending; after sending the box clears and **every message repeats automatically**
4. **Maintain**: groups are collapsed by default (name only) — click to expand for editing; enable/disable, move up/down, and delete live in the group header row; the **「Settings」** item at the bottom of the selector menu jumps straight to the config

## Known edge cases

- If you manually clear the input box, the content is re-injected within ~500ms — this is by design (deselect first if you want to send plain text), not a bug
- The missing-skill marker depends on an active session; without one the card shows no ⚠️, but missing skill invocations are still skipped when injecting
- No injecting during IME composition (e.g. Chinese input) or while a message is being submitted (guard)
