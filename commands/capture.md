---
name: capture
description: Capture what you did as project-level Session(s) - one per ticket/bug/feature - AND update (or create) the area context doc(s) you touched, plus the project overview when something project-wide changed.
argument-hint: "[summary]"
---

# /capture

Mirror the Obsidian `/capture` ritual against the team's shared lore. Two distinct things:

1. **Session(s)** — the append-only record of *what you did*. **Project- and user-scoped, NOT attached to a node.** One session per **unit of work** (a ticket / bug / feature). A single conversation/day can produce 1, 2, or many sessions, across different projects.
2. **Area `context` doc(s)** — the *authored, stable reference* for each area you touched, updated to stay accurate.

> **The backend is just storage. You (the agent) author everything** — nothing is synthesized. Sessions go in the team's captures feed (per user); context docs are the per-area "how it works".

This command needs the `sharedlore` MCP server connected (run `/lore:init` first if it isn't).

## Step 1 - decide if anything is worth saving

Save only if real work happened: a decision made, progress on a feature/bug/investigation, something learned, or next steps that would be lost. Do NOT save pure Q&A with no outcome, or work already recorded. If nothing qualifies, say "Nothing worth capturing this session." and stop.

## Step 2 - capture the session(s) — one per unit of work

Identify the **distinct units of work** in this conversation — each ticket, bug, or feature is its own session. Don't lump unrelated work into one session, and don't split one cohesive task into many.

For **each** unit:
- Compose a `body`: what was done, the decisions/findings, and **why it matters** — enough for a teammate to act on cold.
- Add a one-line `summary` — the ticket/feature name (this is what shows in the standup and the captures feed).
- Call **`lore_capture`** with `body` and `summary`, and **NO `node`** (project-level). Pass `project` only if capturing into a project other than the cwd's `.lorerc`.

If the work spans **multiple projects**, capture each project's session against that project (pass its `project` slug).

## Step 3 - reconcile the area `context` doc(s): update touched, create missing

**Not optional** — a session capture without keeping the area docs current defeats the point of shared lore. Do this every time real work touched an area.

First **list what already exists**: call **`lore_tree`** to get the project's current folders and `context` nodes (use `lore_search` to confirm specifics). This is your map of existing areas.

Then **map the session to areas** — infer every area the work touched from the file paths/modules changed — and **iterate**, deciding for each what to do:
- **Touched area that already has a `context` doc** → read it (`lore_context` at `<area>/context`, omit `body`), fold in what changed, write it back.
- **Touched work with no owning area** (a subsystem/feature cluster no existing `context` node covers) → **create a new area**. Areas can be **nested** (path-like, e.g. `web/billing`) when a feature is substantial enough to deserve its own doc inside a larger area — same as the Obsidian ritual.
- **Existing area the session didn't touch** → leave it alone.

Write each with **`lore_context`** (`path: <area>/context`, `title:` the area name, full `body`): a **"how this area works"** reference (~200-400 words, scannable) — purpose, key files/classes, how it works, known gotchas. **Not** a changelog: integrate the new understanding, prune the stale. Weave `[[wikilinks]]` inline.

Finally, if something **project-wide** changed (a cross-cutting decision, a new area, a tier/billing change), revise the **project overview** at path `context` (title `Overview`) — keep it a stable ~400-word reference, prune as you add.

## Step 4 - detect ADR-worthy decisions

If a decision is significant (non-obvious architectural/technical choice with trade-offs, likely to be revisited), ask: "This looks ADR-worthy: **<decision>**. Record it as an ADR?" — and on yes, write it with **`/lore:adr`** (or `lore_adr`) at `adr/<slug>`. Skip if nothing qualifies.

## Step 5 - confirm

Tell the user: each session captured (with its summary) and to which project, every area `context` doc updated, and whether an ADR was created.
