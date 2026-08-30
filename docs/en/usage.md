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

## Known edge cases

- If you manually clear the input box, the content is re-injected within ~500ms — this is by design (deselect first if you want to send plain text), not a bug
- The missing-skill marker depends on an active session; without one the card shows no ⚠️, but missing skill invocations are still skipped when injecting
- No injecting during IME composition (e.g. Chinese input) or while a message is being submitted (guard)
