# Install

> The plugin is installed into the dsh profile as a **symlink** pointing to this repo — **no reinstall needed after code changes**; just rebuild and restart dsh.

## Install / Uninstall

From inside the repo directory:

```bash
pnpm install:plugin       # install (equivalent to dsh plugin --profile web add "$PWD")
pnpm uninstall:plugin     # uninstall
```

Or specify the path explicitly:

```bash
dsh plugin --profile web add <repo-path>            # install
dsh plugin --profile web remove dsh-skill-injector  # uninstall
```

## Install from GitHub (after open-sourcing)

```bash
dsh plugin --profile web add github:user/repo
```

Pin a branch/tag:

```bash
dsh plugin --profile web add github:user/repo#main
```

> How it works: `dsh plugin add` forwards its arguments to pnpm, which natively supports `github:user/repo` specs. The `lib/` build artifacts are committed, so the fetched package is ready to use — no build needed — and the `dsh.bundle` declaration makes it mount automatically as a profile layer.

> **Restart dsh web** after installing — the plugin layer is loaded at boot time.

## Iterating after code changes

```bash
pnpm build        # regenerate lib/ (translates src/ into the JS that dsh can read)
# then restart dsh web
```

The build artifacts in `lib/` are committed to the repo, so the **first install needs no build**; you only rebuild when you change code under `src/`.

## Safety notes

- For testing, use the **official install/uninstall commands** above — never hand-edit dsh configuration files (under `$DSH_HOME`).
- This repo ships no `--patch` local-load config — it requires an absolute path in the repo, which would leak personal info in an open-source project.
