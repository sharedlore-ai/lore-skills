---
name: start
description: Load the team's shared lore to start a working session - pulls the project briefing (area context docs + recent captures) and sets up on-demand context loading for the rest of the session.
argument-hint: "[directive]"
---

# /start

Load the team's shared context for the current project before you begin work. This is the team equivalent of the Obsidian `/start` ritual: instead of reading a local vault, it pulls the **derived area context** plus **recent session captures** from the SharedLore server the whole team writes into - and then, for the rest of the session, it loads deeper area context **on demand** as you actually touch it, rather than dumping everything up front.

This command needs the `sharedlore` MCP server connected. The active project comes from `.lorerc` at the repo root (written by `/lore:init`), falling back to `LORE_PROJECT`. If the `lore_start` tool isn't available, tell the user to run `/lore:init` first and stop.

> The area `context` docs are **authored** (hand-written by the agent during `/lore:capture`), not AI-synthesized. The backend just stores them.

> **MANDATORY ORDER - NO EXCEPTIONS.** Pull the briefing (Step 1) and resolve whatever the directive points at from lore (Step 2) **before you touch code.** Even when the directive hands you a concrete task, you do NOT grep / read / edit repo files until you've checked whether the team already wrote down what you need - a named plan/adr (Step 2's artifact branch), the relevant area's `context`, or a memory. If you catch yourself reaching for `Bash`/`Grep`/`Edit` to *reconstruct* something before loading the lore node that already describes it, STOP - you've skipped the ritual. (The whole point of shared lore is that you don't re-derive, and don't ask the user, what the team already documented.)

## Step 1 - pull the briefing

Call the **`lore_start`** MCP tool.
- If the user passed a directive in `$ARGUMENTS`, send it as the `directive` argument so the briefing is framed around what they are about to work on.
- Leave `project` unset to use the configured default; only pass `project` if the user names a different slug.

The briefing is **deliberately shallow**: the **project overview** (in full), an **index of areas** and **team memories** to load on demand, and the **recent captures** (what teammates last did). It does NOT dump every area body — you pull those with `lore_context` as the work touches them (see the standing instructions).

## Step 2 - handle the directive

The argument almost always says what to work on. Don't ask "which area?" if they already told you. Classify it **in this order** - the first match wins:
- **A named artifact** (the directive says "the plan/adr/doc/spec/ticket X", or contains a slug-like token such as `server-side-dashboard-data`) → it refers to an **existing node**, not an area. **`lore_search` for it FIRST** - map the noun to a `kind` filter (`plan`→`plan`, `adr`→`adr`, `log`→`log`, `todo`→`todo`) - then read the hit with **`lore_context`** and present/work against **that** node. **Do NOT reconstruct it from the codebase**; the whole point is that the team already wrote it down. Only if nothing matches, fall through to the next case.
- **A ticket / feature / area name** → if the relevant area is NOT already in the briefing, fetch its context now with **`lore_context`** at that area's path (discover the path with `lore_tree` or `lore_search` if you don't know it).
- **Vague / empty** → rely on the briefing's area list and ask which area at the end.

## Step 3 - present the briefing AND start working

Present a tight summary (3–6 lines): what the in-flight work is, the most relevant recent captures for the directive, and the next steps. Then:
- If a task/area was given, **start working on it immediately** - fetch the likely area's context, search for the relevant nodes, begin. The user calling `/start` with a directive IS the go-ahead; don't re-ask.
- Only ask "which area?" if the argument was empty or too vague to act on.

Do not invent context - only surface what the tools return.

## Standing instructions for the rest of the session

These fire on what you **do**, not on what the user says. Keep them active for the whole conversation.

### Dynamic node loading (the core of the session)
The briefing is deliberately shallow - the project overview + recent captures, not every area. The session works by **loading the specific node on demand** as the user steers, then letting it inform your work. Load each node **at most once** per conversation; never invent paths (discover with **`lore_search`** / **`lore_tree`** if unsure).
- **An area** ("let's work on `skills`", or you start touching files that map to one) → `lore_context` at `<area>/context` (and its parent if nested, e.g. `web/billing` → also `web`).
- **A todo / plan / log / adr** the user names or implies ("we have this todo", "pull up the plan X", "what did the ADR on Y decide") → `lore_search` with the matching **`kind`** filter (`todo`/`plan`/`log`/`adr`), then read the hit with `lore_context` and **work against that node - don't reconstruct it from the codebase.** (This is the same rule as Step 2's named-artifact branch, applied mid-session.)

### Activity-based loading (fires on what you touch - reads AND edits)
Before (or right after) you start working on a file/module - **whether you're reading it or editing it** - map it to its SharedLore area path (e.g. `skills/**` → `skills`; `apps/web/**` → `web`) and silently `lore_context` it if not yet loaded. This especially covers **structural facts**: before you decide "where does this live / what's the source of truth / is this a mirror / how does it publish", consult the area context - **don't re-derive it from CI configs, and don't ask the user.**

### Team memories are active rules
Early in the session, load the team's **memories** (`lore_search` with `kind: memory`, or `lore_tree` under `memories/`) and treat them as **standing conventions for everything you do** - coding style (e.g. no single-quoted strings, every method ends with a comma), preferences, hard-won learnings. These are the team's shared equivalent of always-on memory: apply them without being reminded, the way you'd honor a `CLAUDE.md` rule. When the user states a new durable convention, save it with **`/lore:memory`**.

### Don't outsource documented facts
Before asking the user a factual question (where X lives, what's canonical, how Y deploys), first check the briefing, the relevant area context, and lore. Asking the user something the team already wrote down is the exact failure this command exists to prevent.

### Capture at the end
When the session produces something durable (a decision, a non-obvious fix, a change in direction), run **`/lore:capture`** so the next teammate's `/start` benefits. Record significant architectural decisions with **`/lore:adr`**.
