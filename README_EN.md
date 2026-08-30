# dsh-skill-injector

> 中文：[README.md](README.md)

A dsh (DeepSeek Harness) plugin: preset common skill combinations and auto-fill them into the first line of the input box. Enable, switch, and stop with one click — no more typing `/grill-me` before every conversation.

## Features

- **Preset group management**: create/read/update/delete, enable/disable, and reorder skills in Settings → Plugins → Plugin Config
- **One-click select**: the 「Preset」 selector next to the FULL ACCESS button in the composer toolbar — click to select, click again to deselect
- **Auto-fill**: an empty input box gets the skill text filled in within ~500ms (e.g. `/grill-me /domain-modeling `)
- **Smart guard**: nothing is filled when the input box already has content — existing content is never touched
- **Global persistence**: the selection survives page refreshes, dsh restarts, and browser tabs

## Quick install

```bash
dsh plugin --profile web add github:user/repo        # install from GitHub
dsh plugin --profile web add <repo-path>             # local/development install
```

> No build needed on first install (`lib/` artifacts are committed). See [Install](docs/en/install.md).

## Rebuild

After changing code, regenerate `lib/` and restart:

```bash
pnpm install      # install the toolchain
pnpm build        # build artifacts
dsh web           # start the service
```

## Update

**Local path install (symlink)** — update = change code + rebuild, no reinstall:

```bash
pnpm build        # regenerate lib/
# restart dsh web
```

**GitHub install (clone)** — the installed copy is unrelated to your local code; update by re-pulling:

```bash
dsh plugin --profile web add github:user/repo        # pull the latest version
# restart dsh web
```

> If re-adding does not update, uninstall and reinstall first (see [Uninstall](#uninstall)).

## Uninstall

```bash
dsh plugin --profile web remove dsh-skill-injector    # uninstall
# or from inside the repo: pnpm uninstall:plugin
```

## Docs

- [Install](docs/en/install.md)
- [Usage](docs/en/usage.md)
- [Architecture](docs/en/architecture.md)
