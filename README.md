# SharedLore - Claude Code plugin + CLI

The developer-facing layer for **SharedLore**: team-shared "lore" (area context docs,
append-only session captures, and structured docs - ADRs, logs, TODOs, plans) that your
AI coding agent reads and writes for the whole team.

It mirrors the personal Obsidian command ritual (`/start`, `/capture`, `/adr`, `/log`,
`/todo`, `/plan`, recall) - but the source of truth is a shared server the whole team
writes into, not a local vault.

This repo is two thin clients over the [`@sharedlore/mcp`](../lore-mcp) MCP server:

- **`commands/`** - Claude Code slash commands, shipped as a Claude Code **plugin** named
  `lore`. Each one tells your agent to call the matching `lore_*` MCP tool. Once installed
  they are namespaced as `/lore:start`, `/lore:capture`, …
- **`cli/`** - a minimal `lore` CLI (`@sharedlore/cli`) for logging in, linking a project
  (writes `.lorerc`), and capturing team lore from your terminal.

> This repo is **public**. There are no secrets in it. Your API token lives only in your
> local config at `~/.config/sharedlore/config.json` - never commit it anywhere. The
> `.lorerc` file (`organization` + `project` slugs only, no secrets) *is* meant to be
> committed.

## Install the Claude Code plugin

The slash commands ship as a plugin named `lore`. Add this repo as a marketplace and
install it:

```bash
claude plugin marketplace add sharedlore-ai/lore-skills
claude plugin install lore@sharedlore
```

That makes the following commands available in Claude Code:

- `/lore:init` → `lore_projects` / `lore_create_project` - interactively link this repo to a project (writes `.lorerc`). The recommended in-agent way to link a repo.
- `/lore:start [directive]` → `lore_start` - pull the team's derived context + recent captures.
- `/lore:capture [node-path]` → `lore_capture` - evaluate the conversation and append a session capture.
- `/lore:adr`, `/lore:log`, `/lore:todo`, `/lore:plan` → `lore_adr` / `lore_log` / `lore_todo` / `lore_plan`.
- `/lore:recall <query>` → `lore_search`.

The `/lore:` prefix is the plugin's manifest `name` (`lore`); each `commands/<file>.md`
auto-namespaces to `/lore:<file>`. The commands require the `sharedlore` MCP server (below)
to be configured.

## Onboarding

### 1. Install the CLI

```bash
npm i -g @sharedlore/cli
```

### 2. Log in

Create an API token in the SharedLore dashboard (**API tokens** → new token) and copy the
`lore_sk_...` value (shown once). Then:

```bash
lore login            # paste the token when prompted, confirm the API URL
# or non-interactively:
lore login --token lore_sk_xxx --api-url https://lore.example.com/graphql
```

This verifies the token, writes it plus the API URL to `~/.config/sharedlore/config.json`,
and prints the `.mcp.json` snippet to add to your agent (see step 4).

### 3. Link your project

The recommended way to link a repo is the **interactive** flow - it lists the projects in
your org (the token fixes the org) and lets you pick one or create a new one, then writes
`.lorerc` for you. Use whichever fits your workflow:

- **In your agent:** run **`/lore:init`**. It calls `lore_projects`, asks you to pick an
  existing project or create one, and writes `.lorerc`.
- **From the terminal:** run **`lore init`** from the repo root:

  ```bash
  lore init
  ```

  It prints the projects in your org, prompts you to pick one by number or create a new one
  (enter a name), then writes `.lorerc`.

Either way it writes a **`.lorerc`** file carrying both the org and project slug:

```json
{
  "organization": "my-org-slug",
  "project": "my-project-slug"
}
```

`organization` is included for clarity and validation; **`project` is authoritative** (the
org always comes from the token). If you already know the slug you can skip the interactive
flow with `lore link my-project-slug`.

The MCP server and the CLI both resolve the active project from `.lorerc` - walking up
parent directories from the cwd, like git finds `.git` - so you never pass a project slug or
set an env var per command. Commit `.lorerc` so your whole team shares the same link. Run
`lore unlink` to remove it.

Project resolution precedence: an explicit `project` argument → `.lorerc` (cwd, walking up)
→ the `LORE_PROJECT` env var.

### 4. Add the MCP server to your agent

`lore login` prints this for you (with your real values filled in). Add it to your Claude
Code / Cursor `.mcp.json`. Note there is **no** `LORE_PROJECT` - the project comes from
`.lorerc`:

```json
{
  "mcpServers": {
    "sharedlore": {
      "command": "npx",
      "args": ["-y", "@sharedlore/mcp"],
      "env": {
        "LORE_API_URL": "https://lore.example.com/graphql",
        "LORE_API_TOKEN": "lore_sk_xxx"
      }
    }
  }
}
```

### 5. Use the commands

Install the plugin (top of this README) and the `/lore:*` commands are available:

- `/lore:init` - link this repo to a project (pick an existing one or create one), writes `.lorerc`.
- `/lore:start [directive]` - pull the team's derived context + recent captures.
- `/lore:capture` - evaluate the conversation and append a session capture.
- `/lore:adr`, `/lore:log`, `/lore:todo`, `/lore:plan`, `/lore:recall <query>`.

The commands require the `sharedlore` MCP server (step 4) to be configured.

## CLI reference

| Command | What it does |
| --- | --- |
| `lore login [--token <t>] [--api-url <u>]` | Save token + API URL, print the `.mcp.json` snippet. |
| `lore init` | Interactively pick or create a project in your org, then write `.lorerc` (`organization` + `project`). |
| `lore link <project-slug>` | Write `.lorerc` linking this repo to a known project slug. |
| `lore unlink` | Remove the `.lorerc` from this repo (or nearest parent). |
| `lore capture "<body>" --node <path> [--summary <s>]` | Append a session capture (calls `captureSession`). |
| `lore start [directive]` | Print the team briefing (calls `briefing`). |
| `lore whoami` | Show the current user and the linked project source. |

The CLI talks to the lore-api GraphQL endpoint directly using your stored token; the token
scopes the org server-side, so no org header is needed.

The auth token + API URL live in `~/.config/sharedlore/config.json` (override the dir with
`XDG_CONFIG_HOME`). The active project comes from `.lorerc` in the cwd (walking up parents),
falling back to the `LORE_PROJECT` env var. Env vars `LORE_API_URL` / `LORE_API_TOKEN`
override the config file.

## Develop

```bash
cd cli
npm install
npm run build   # tsc -> dist/
```

Requires Node 20+ (uses the global `fetch`). No runtime dependencies.
