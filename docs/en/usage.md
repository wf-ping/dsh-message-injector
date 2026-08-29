# Usage

## Configure preset groups

Settings → Plugins → Plugin Config → find the dsh-skill-injector card:

1. Add a preset group, e.g. name `grill`, one skill per line: `grill-me`, `domain-modeling`
2. Save (the group name must be unique and contain at least one skill; missing skills are marked with ⚠️ and skipped when filling)

## Select / deselect

1. Back in a conversation, a **「Preset」** button appears next to the FULL ACCESS button in the composer toolbar
2. Click it → choose a preset group (you may also select none)
3. **Clicking the currently selected group again = deselect**, which stops auto-filling

## Auto-fill

- Once a group is selected, an **empty input box** gets the skill text filled in within ~500ms (one line, space-separated, e.g. `/grill-me /domain-modeling `)
- Every message automatically carries the skills; if the input box **already has content, nothing is filled** — existing content is never touched
- The selection persists globally: across page refreshes, dsh restarts, and browser tabs

## Known edge cases

- If you manually clear the input box, the skills are re-filled within ~500ms — this is by design (deselect first if you want to send plain text), not a bug
- The missing-skill marker depends on an active session; without one the card shows no ⚠️, but saving is still validated by the backend
- No filling during IME composition (e.g. Chinese input) or while a message is being submitted (guard)
