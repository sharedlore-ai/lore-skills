---
name: memory
description: Save a durable fact, learning, or preference as a memory in the team's SharedLore.
argument-hint: "<the fact>"
---

# /memory

Record a durable fact into the team's shared lore as a **memory** node (kind `memory`) - a small, single-purpose note meant to persist and be recalled later: a user/team **preference**, a non-obvious **learning** about the system, a convention, or a pointer to an external resource. Memories are the long-lived "remember this" facts - distinct from **sessions** (what was *done*) and **context** docs (how an *area* works).

This command requires the `sharedlore` MCP server to be configured.

## Do this

1. Distill the fact from `$ARGUMENTS` (or the conversation) into a **clear, self-contained** Markdown `body` - **one fact per memory**. For a preference/feedback-style fact, include **why** it matters and **how to apply** it. Link related memories or areas with `[[wikilinks]]`.
2. Choose a node `path` under `memories/` (e.g. `memories/no-claude-coauthor`, `memories/prefers-server-actions`) and a short `title`. If a memory for this fact already exists, reuse its path to update it rather than duplicating.
3. Call the **`lore_memory`** MCP tool with `path`, `title`, and `body` (leave `project` unset to use the default).
4. Confirm the saved memory path back to the user.

Keep memories small and findable - one fact each. Don't save what the code or an area's `context` already records. If you're recording *what was done*, that's **`/lore:capture`** (a session), not a memory.
