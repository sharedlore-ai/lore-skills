---
name: start
description: Load the team's shared lore to start a working session - a subagent pulls the project briefing and resolves your directive in its own context window, returning a compact brief plus the area/memory indexes; deeper context loads on demand for the rest of the session.
argument-hint: "[directive]"
---

# /start

Load the team's shared context for the current project before you begin work. This is the team equivalent of the Obsidian `/start` ritual: a **subagent** does the heavy pull - the SharedLore briefing plus resolving whatever the directive points at - in its **own context window**, and returns only a compact brief and the indexes the session needs. The raw project overview, capture bodies, and any search misses never enter the main window - keeps `/start` cheap. Deeper area context is loaded **on demand** as you actually touch it, rather than dumped up front.

This command needs the `sharedlore` MCP server connected. The active project comes from `.lorerc` at the repo root (written by `/lore:init`), falling back to `LORE_PROJECT`. If the sharedlore tools aren't available, tell the user to run `/lore:init` first and stop.

> The area `context` docs are **authored** (hand-written by the agent during `/lore:capture`), not AI-synthesized. The backend just stores them.

> **MANDATORY ORDER - NO EXCEPTIONS.** Spawn the briefing subagent (Step 1) and present its brief (Step 2) **before you touch code.** Even when the directive hands you a concrete task, you do NOT grep / read / edit repo files until the brief has been delivered and you've checked whether the team already wrote down what you need - a named plan/adr (the subagent's `resolved_node`), the relevant area's `context`, or a memory. If you catch yourself reaching for `Bash`/`Grep`/`Edit` to *reconstruct* something before loading the lore node that already describes it, STOP - you've skipped the ritual. (The whole point of shared lore is that you don't re-derive, and don't ask the user, what the team already documented.)

## Step 1 - delegate the briefing to a subagent

Spawn **one** `general-purpose` subagent via the `Agent` tool and **wait for its result** (foreground - you need it before doing anything else). Its job is to pull the briefing and resolve the directive - NOT to dump raw lore into the main window. Pass it the verbatim `$ARGUMENTS` as the directive.

Use this prompt (substitute `<directive>`):

> You are loading the team's shared context from SharedLore for a working session. Use the `sharedlore` MCP tools (`mcp__sharedlore__lore_start`, `mcp__sharedlore__lore_search`, `mcp__sharedlore__lore_context`, `mcp__sharedlore__lore_tree`) - if their schemas aren't loaded, load them with `ToolSearch` first. If the tools are unavailable entirely, return exactly `NO_LORE`.
>
> 1. Call `lore_start` with `directive: "<directive>"` (omit the argument if the directive is empty). Leave `project` unset. It returns the project overview, an index of areas, an index of team memories, and recent captures.
> 2. Resolve the directive - classify it in this order, first match wins:
>    - **Names an artifact** (says "the plan/adr/doc/spec/ticket X", or contains a slug-like token) → `lore_search` for it with the matching `kind` filter (`plan`→`plan`, `adr`→`adr`, `log`→`log`, `todo`→`todo`), then read the hit with `lore_context`. Do NOT reconstruct it from anything else - the team already wrote it down. If nothing matches, fall through.
>    - **Names a ticket / feature / area** → `lore_context` that area's `<area>/context` path (discover the path with `lore_tree` or `lore_search` if unsure).
>    - **Vague / empty** → skip resolution.
>
> Return EXACTLY this markdown - no preamble, no dump of the overview or capture bodies:
>
> ```
> **Project:** <name> - <one line: what it is, from the overview>
>
> **Where we left off:** <1-2 sentences from the most recent captures, filtered to what's relevant to the directive>
>
> **Directive:** <what it resolved to - "plan X at <path>", "area Y context loaded", or "none">
>
> **Notes:** <at most 3 bullets from the overview/captures that directly bear on the directive; omit the block if nothing stands out>
>
> ---RAW---
> areas:
> <the briefing's area index VERBATIM - every line>
> memories:
> <the briefing's memory index VERBATIM - every line, hook + memories/<slug> path. Do NOT paraphrase, truncate, or drop entries - these become standing rules for the orchestrator.>
> resolved_node:
> <the FULL verbatim body of the node you resolved in step 2, prefixed with its path, or NONE>
> ```
>
> Keep the brief tight. The `---RAW---` block is metadata for the orchestrator - include it always, complete.

If the subagent returns `NO_LORE`, tell the user to run `/lore:init` first and stop.

Keep the `---RAW---` block (area index, memory index, resolved node) for your own use in the standing instructions below - do NOT show it to the user.

## Step 2 - present the brief AND start working

Present the subagent's brief (the part above `---RAW---`) as a **lore card**: one fenced code block using left-border `│ ` lines. Never draw full boxes (`╭─╮`) - they misalign. Wrap lines at ~70 chars, continuing on a fresh `│ ` line; separate sections with a bare `│`. Fill the counts from the RAW indexes.

```
pulling team lore… <n> areas · <m> memories

│ <PROJECT> · <name>
│ <one line: what it is>
│
│ where we left off: <1-2 sentences from the brief>
│
│ note · <bullet, one per line - omit these lines if the brief has none>
│
│ directive: <what it resolved to - "plan X at <path>", "area Y context loaded", or "none">

✓ lore loaded
```

Then:
- If a task/area was given, **start working on it immediately** - the `resolved_node` body is what you work against (don't re-fetch it); pull further nodes per the standing instructions as the work needs them. The user calling `/start` with a directive IS the go-ahead; don't re-ask.
- Only ask "which area?" if the argument was empty or too vague to act on.

Do not invent context - only surface what the tools returned.

## Standing instructions for the rest of the session

These fire on what you **do**, not on what the user says. Keep them active for the whole conversation.

### Dynamic node loading (the core of the session)
The brief is deliberately shallow - the session works by **loading the specific node on demand** as the user steers, then letting it inform your work. Load each node **at most once** per conversation (the `resolved_node` from Step 1 counts as already loaded); never invent paths (discover with **`lore_search`** / **`lore_tree`** if unsure).
- **An area** ("let's work on `skills`", or you start touching files that map to one) → `lore_context` at `<area>/context` (and its parent if nested, e.g. `web/billing` → also `web`).
- **A todo / plan / log / adr** the user names or implies ("we have this todo", "pull up the plan X", "what did the ADR on Y decide") → `lore_search` with the matching **`kind`** filter (`todo`/`plan`/`log`/`adr`), then read the hit with `lore_context` and **work against that node - don't reconstruct it from the codebase.** (This is the same rule as Step 1's artifact branch, applied mid-session.)

### Activity-based loading (fires on what you touch - reads AND edits)
Before (or right after) you start working on a file/module - **whether you're reading it or editing it** - map it to its SharedLore area path using the `areas` index from the `---RAW---` block (e.g. `skills/**` → `skills`; `apps/web/**` → `web`) and silently `lore_context` it if not yet loaded. This especially covers **structural facts**: before you decide "where does this live / what's the source of truth / is this a mirror / how does it publish", consult the area context - **don't re-derive it from CI configs, and don't ask the user.**

### Team memories are active rules
The subagent's `---RAW---` block carries the team's **memory index** - one line per memory with a hook (its first line) and its `memories/<slug>` path. **Keep that index in context for the whole session as standing guidance** - treat it the way you'd honor a `CLAUDE.md` rule: coding style (e.g. no single-quoted strings, every method ends with a comma), preferences, hard-won learnings. The hook itself often carries the rule; apply it without being reminded. Do NOT dump the index to the user, and do NOT pre-load every memory body up front - the index is enough to know what exists.

**On-demand memory recall.** The index is a recall table, not the full fact. Before acting on a task, scan the hooks: when one is relevant to what you're about to do, silently pull its **full body** with `lore_context` at that memory's `memories/<slug>` path (discover the path via `lore_search` with `kind: memory` if it isn't in the index), read it, and apply the verbatim guidance - it's a standing instruction, not background trivia. Load each memory body **at most once** per conversation, and only on relevance - the same on-demand discipline as area context. When the user states a new durable convention, save it with **`/lore:memory`**.

### What qualifies as a memory (the bar for `/lore:memory` and `/lore:capture`)
A memory is a durable rule that applies on **every future session** - a preference, convention, or hard-won learning. Before saving one, it must pass **all three gates**; durability alone is NOT enough (that's the exact test that lets redundant reference facts slip through):
1. **Durable, not ticket-scoped.** Still true and useful after the ticket/PR closes. NEVER save ticket/story/PR state - per-app progress, "done vs pending", rollout or branch status - that's capture/session material. A durable rule surfaced by ticket work is fine, stripped of the progress (a "surfaced by X" aside is ok).
2. **A rule, not an encyclopedia entry.** It changes how you *act* (a preference/convention/"always-never do X"). A fact that's merely true-and-useful (topology, limits, how-a-thing-works) is *reference material* - it belongs in the area `context`, not a memory.
3. **Not redundant with an area context.** If it's already in - or you're about to write it into - an area's `context`, don't also save it as a memory. Area docs load on demand when you touch their paths; reserve memories for rules you'd want even when you're not touching that area.

Fail any gate → not a memory. "Nothing durable this session" is a normal outcome; don't manufacture one.

### Don't outsource documented facts
Before asking the user a factual question (where X lives, what's canonical, how Y deploys), first check the brief, the relevant area context, and lore. Asking the user something the team already wrote down is the exact failure this command exists to prevent.

### Capture at the end
When the session produces something durable (a decision, a non-obvious fix, a change in direction), run **`/lore:capture`** so the next teammate's `/start` benefits. Record significant architectural decisions with **`/lore:adr`**.
