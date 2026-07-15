---
name: init
description: First-time SharedLore setup - connect the `sharedlore` MCP server (globally or per-project) and link this repo to a project (writes .lorerc).
argument-hint: ""
---

# /init

Get SharedLore working in Claude Code, end to end. There are two parts, in order:

- **A. Connect the `sharedlore` MCP server** - needed once per machine (global) or per repo (project).
- **B. Link this repo to a project** - writes `.lorerc`.

If the MCP isn't connected yet, do **A** first and stop; once it's connected, do **B**.

---

## A. Connect the MCP server

### Is it already connected?

Try the **`lore_projects`** tool:
- It returns the org + projects → the MCP is already connected. **Skip to part B.**
- It's **not available**, or returns an auth error (*"Missing LORE_API_TOKEN"*, *"Authentication failed …"*) → set it up now with the steps below. Do **not** try to link a project yet.

### Step 1 - get an API token

Tell the user:
> SharedLore uses one personal **API token** (`lore_sk_…`). It identifies **you** - a single token works across **every organization and project you can access**, so you only ever need one (it's not tied to a specific org). There's no separate login.
> Create it at **https://app.sharedlore.com → Dashboard → API tokens → Create token**, and copy the `lore_sk_…` value (it's shown only once).

### Step 2 - ask: global or just this project?

Use **AskUserQuestion** - "Where should the SharedLore MCP server be added?":
- **Globally (recommended if it's just you)** - added once to your Claude Code user config; works in every repo on this machine.
- **Just this project** - lives in a `.mcp.json` in this repo. You can commit it so your whole team gets the setup automatically.

### Step 3 - set it up

**If "Just this project":**

1. **Write `.mcp.json`** at the repo root with the **Write** tool. If a `.mcp.json` already exists, merge the `sharedlore` server into its `mcpServers` - never drop other servers.
   ```json
   {
     "mcpServers": {
       "sharedlore": {
         "command": "npx",
         "args": ["-y", "@sharedlore/mcp@latest"],
         "env": {
           "LORE_API_TOKEN": "lore_sk_PASTE_YOUR_TOKEN_HERE"
         }
       }
     }
   }
   ```
2. Tell the user, clearly:
   > I created **`.mcp.json`** in this repo. Open it and replace **`lore_sk_PASTE_YOUR_TOKEN_HERE`** with the token you copied - that's the only line to change. `.mcp.json` holds no other secrets, so you can commit it for your team.

**If "Globally":**

1. Prompt the user to paste their `lore_sk_…` token and wait for it. (Don't echo it back afterward.)
2. Run this with **Bash**, substituting the token they pasted:
   ```bash
   claude mcp add-json sharedlore --scope user '{"command":"npx","args":["-y","@sharedlore/mcp@latest"],"env":{"LORE_API_TOKEN":"<the lore_sk_… they pasted>"}}'
   ```
   This adds the server to their Claude Code **user** config, so it works in every project.

### Step 4 - restart, then re-run

Tell the user:
> **Restart Claude Code** so it loads the new MCP server, then run **`/lore:init`** again to finish linking this repo.

Then **stop** - don't continue until the MCP is connected.

> _Self-hosting or running SharedLore locally?_ The MCP server defaults to the production API (`https://api.sharedlore.com/graphql`), so no URL is needed on sharedlore.com. To point at your own endpoint, add a `LORE_API_URL` entry to the `env` above (e.g. `http://localhost:3030/graphql`).

---

## B. Link this repo to a project

Once `lore_projects` works:

1. Call **`lore_projects`** - it lists **all** your organizations and their projects (your token spans every org you belong to - personal ones and orgs you've joined).
2. Ask which project to link with **AskUserQuestion**: one option per existing project (label each as `org-slug / project-slug` so the org is obvious), plus a **"Create a new project"** option. If you have just one org and it has no projects, go straight to creating one.
3. **If creating one:** ask which **organization** to create it in (only if there's more than one) and a project **name**, then call **`lore_create_project`** with `organization` (the org slug) and `name` (the slug is auto-derived; pass `slug` only for a specific one). Use the returned project `slug`, and remember which org it's in.
4. **Write `.lorerc`** at the repo root with the **Write** tool, using the **organization that owns the chosen/created project**:
   ```json
   {
     "organization": "<org-slug>",
     "project": "<project-slug>"
   }
   ```
   Both fields matter: `organization` tells SharedLore which of your orgs this repo belongs to (the API resolves it per request), and `project` is the specific vault.
5. Confirm to the user: the repo is linked, **`/lore:start`** and **`/lore:capture`** will use this project from now on, and they should **commit `.lorerc`** so the whole team shares the same link.

Never invent slugs - only use values returned by `lore_projects` or `lore_create_project`.
