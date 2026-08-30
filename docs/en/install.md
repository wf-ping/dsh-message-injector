# Install

There are two install modes with **different update behaviors** — choose the one that fits:

| Mode | What gets installed | How to update |
|---|---|---|
| Local path install | **Symlink** pointing to your repo | Change code → `pnpm build` → restart dsh; no reinstall |
| GitHub install | **Clone** of the repo, unrelated to your local code | Re-run `add` to pull the latest (local changes don't affect the installed clone) |

## Local path install (development)

From inside the repo directory:

```bash
pnpm install:plugin       # install (equivalent to dsh plugin --profile web add "$PWD")
pnpm uninstall:plugin     # uninstall
```

Or specify the path explicitly:

```bash
dsh plugin --profile web add <repo-path>            # install
dsh plugin --profile web remove dsh-message-injector  # uninstall
```

**Iterating after code changes** (the symlink points at the repo, so changes take effect immediately):

```bash
pnpm build        # regenerate lib/ (translates src/ into the JS that dsh can read)
# then restart dsh web
```

The build artifacts in `lib/` are committed to the repo, so the **first install needs no build**; you only rebuild when you change code under `src/`.

## Install from GitHub (for end users after open-sourcing)

```bash
dsh plugin --profile web add github:wf-ping/dsh-message-injector          # latest (tracks the main branch HEAD)
dsh plugin --profile web add github:wf-ping/dsh-message-injector#v0.1.0    # pin a released version (recommended for stability)
```

> Convention: no `#` = the default branch (main) latest; `#tag` = a pinned release (e.g. `#v0.1.0`). There is no `latest` tag — for git installs "latest" is naturally the main HEAD; tags exist only for pinning.

> How it works: `dsh plugin add` forwards its arguments to pnpm, which natively supports `github:wf-ping/dsh-message-injector` specs (with `#ref` for tags/branches/commits). The `lib/` build artifacts are committed, so the fetched package is ready to use — no build needed — and the `dsh.bundle` declaration makes it mount automatically as a profile layer.
> Note: this installs a **clone** of the repo — changing and rebuilding your local code does **not** affect it; to update, re-run the `add` command above to pull the latest.

> **Restart dsh web** after installing — the plugin layer is loaded at boot time.

## Safety notes

- For testing, use the **official install/uninstall commands** above — never hand-edit dsh configuration files (under `$DSH_HOME`).
- This repo ships no `--patch` local-load config.
