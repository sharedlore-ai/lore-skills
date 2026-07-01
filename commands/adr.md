---
name: adr
description: Create or update an Architecture Decision Record in the team's SharedLore.
argument-hint: "<the decision>"
---

# /adr

Record an Architecture Decision Record in the team's shared lore, mirroring the Obsidian `/adr` ritual. ADRs are structured, **numbered** documents (kind `adr`) capturing a non-obvious architectural/technical choice with trade-offs — the whole team reads them via `/lore:start` and on-demand recall. **Always write the ADR in English**, regardless of the conversation language.

This command requires the `sharedlore` MCP server to be configured.

> If `$ARGUMENTS` is empty **and** the conversation has no clear decision to record, ask the user to describe the decision first — **do not fabricate one.**

## Do this

1. **Draft from the conversation** (and `$ARGUMENTS`): the situation/forces, the decision made, the alternatives weighed, and the consequences. Ask the user to confirm or expand any section you don't have enough context for.

2. **ADRs are a single numbered sequence at `adr/`** — never nested inside an area folder, even when the decision is area-scoped. Find the next number: **`lore_tree`** (or `lore_search`) with `kind: adr`, take the highest existing `adr-NNN`, add 1 (start at `adr-001` if none). The node `path` is **`adr/adr-NNN-<short-kebab-slug>`** (e.g. `adr/adr-006-server-render-dashboard`), the `title` is human-readable (e.g. `ADR-006: Server-render the dashboard`).
   - **Updating an existing ADR** (a superseded/revised decision): reuse its exact path instead of allocating a new number.

3. **Write the `body`** with `lore_adr` (`path`, `title`, `body`), using this structure — omit a section only if it genuinely has no content, and weave `[[wikilinks]]` to related ADRs/areas inline:

   ```markdown
   **Date:** YYYY-MM-DD · **Status:** Accepted

   ## Context
   The situation or problem forcing a decision, and the forces at play.

   ## Decision
   The choice made, stated plainly.

   ## Alternatives considered
   - **<Option A>** — what it was and why it lost.
   - **<Option B>** — what it was and why it lost.

   ## Consequences
   **Positive:** <benefits>
   **Negative / trade-offs:** <downsides, risks, follow-ups>

   ## Notes
   Links, related decisions ([[adr-00X-...]]), follow-up actions.
   ```

4. Leave `project` unset to use the default (`.lorerc`). **Confirm** the saved ADR path and its number back to the user.
