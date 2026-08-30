# Usage

## Configure preset groups

Settings → Plugins → Plugin Config → find the dsh-message-injector card:

1. Add a preset group, e.g. name `grill`, one content line per row: `/grill-me`, `/domain-modeling` (skill invocations carry a leading `/`), or plain text such as "Please answer in Chinese"
2. Save (the group name must be unique and contain at least one content line; `/`-prefixed lines whose skill does not exist are marked with ⚠️ and skipped when injecting)

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
