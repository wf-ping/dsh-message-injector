# dsh-message-injector

> 中文：[README.md](README.md)

A dsh (DeepSeek Harness) plugin: preset common "message injection" content combinations (arbitrary text / skill invocations) and **auto-inject them into every message** at the first line of the input box. Enable, switch, and stop with one click — no more typing the same instruction prefix or format requirement into every message.

## Features

- **Preset group management**: create/read/update/delete, enable/disable, reorder groups, and collapse groups in the sidebar Plugins page → this plugin → row config — with the same official card look
- **One-click select**: the 「Preset」 selector at the bottom-left of the composer — click to select, click again to deselect
- **Config shortcut**: a 「Configure」 item at the bottom of the selector menu opens this plugin's page
- **Auto-inject**: an empty input box gets the content injected within ~500ms (e.g. `/grill-me /domain-modeling ` or "Please answer in Chinese")
- **Skill validation**: lines starting with `/` are treated as skill invocations — missing skills are warned in the config card and skipped when injecting
- **Smart guard**: nothing is injected when the input box already has content — existing content is never touched
- **Global persistence**: the selection survives page refreshes, tabs, and restarts — shared between terminal `dsh web` and the VS Code panel

## Where the config lives

Preset groups and the selection live in the **dsh config system** (settings namespace `dsh-message-injector`, persisted into the current profile's `cordis.patch.yml`). Because it lives on the Host, terminal `dsh web` and the VS Code panel read the same data, and switching browsers loses nothing.

When the Host does not serve that namespace (older dsh / no settings mounted), the plugin falls back to browser localStorage (key `dsh-message-injector:config`). On the first load after upgrading, the old localStorage presets are merged into the Host: same-name groups follow the Host, groups only the old store had are added — no group is dropped.

## Quick install

```bash
dsh plugin --profile web add github:wf-ping/dsh-message-injector        # install from GitHub (default = latest, tracks main)
dsh plugin --profile web add github:wf-ping/dsh-message-injector#v0.2.1  # pin a specific version (optional)
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
dsh plugin --profile web add github:wf-ping/dsh-message-injector        # pull the latest version
# restart dsh web
```

> If re-adding does not update, uninstall and reinstall first (see [Uninstall](#uninstall)).

## Uninstall

```bash
dsh plugin --profile web remove dsh-message-injector    # uninstall
# or from inside the repo: pnpm uninstall:plugin
```

## Docs

- [Install](docs/en/install.md)
- [Usage](docs/en/usage.md)
- [Architecture](docs/en/architecture.md)
- [Changelog](CHANGELOG.md) (zh)
- [Iteration log](docs/zh/迭代记录.md) (zh)
