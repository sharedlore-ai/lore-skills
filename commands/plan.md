---
name: plan
description: Save the plan agreed in this conversation to the team's SharedLore - a single plan node, or a multi-file plan (several plan nodes under a folder).
argument-hint: "[path or title]"
---

# /plan

Save the plan you and the user have agreed on into the team's shared lore, mirroring the Obsidian `/plan` ritual. A plan is a structured document (kind `plan`) the team can later load and **execute against without re-deriving it**. **Always write the plan in English**, regardless of the conversation language.

A plan can be **one node** or, for a larger effort, a **multi-file plan**: several `plan` nodes under a folder, one per phase — e.g. `npm-packages/01-init`, `npm-packages/02-publish`, `npm-packages/03-cutover`. The folder groups them; the `NN-` prefix orders them. (The folder node is created automatically from the path.)

This command requires the `sharedlore` MCP server to be configured.

> If the conversation has **no clear agreed plan** to capture, tell the user and ask them to outline it first — **do not fabricate scope.** Capture only what was actually decided.

## Do this

1. **Decide single vs multi-file.** Small / cohesive plan → **one node**. A plan with **distinct phases or workstreams** the team would execute separately → **split it** into multiple plan nodes under a shared folder.

2. **Single plan:** choose a node `path` (use `$ARGUMENTS` if given, else infer, e.g. `plans/migrate-to-sidekiq-7`) and a clear `title`. Call **`lore_plan`** with `path`, `title`, and a `body` following the skeleton below.

3. **Multi-file plan:** pick a **folder path** (from `$ARGUMENTS` or inferred, e.g. `npm-packages`). For **each phase**, call **`lore_plan`** at **`<folder>/NN-slug`** (`npm-packages/01-init`, `02-publish`, …) with a phase `title` and a focused, self-contained `body`. Also write a **`<folder>/00-overview`** node stating the overall goal and listing the phases with `[[wikilinks]]` to each, so the plan reads top-down. The shared folder and ordering come from the paths — no extra step.

4. **Body skeleton** (omit a section if it has no real content; weave `[[wikilinks]]` to related areas/plans/ADRs inline):

   ```markdown
   ## Goal
   What this plan achieves, in 1–3 sentences.

   ## Background / context
   The situation, the relevant existing system, and why this plan exists.

   ## Scope — what we will do
   Concrete, ordered list of the work this plan covers.

   ## Out of scope
   What we are explicitly NOT doing here (now, or handled elsewhere).

   ## Approach / steps
   The step-by-step approach — file paths, endpoints, models, commands discussed.

   ## Open questions
   Unresolved decisions or things to confirm. Omit if none.

   ## References
   Related areas/nodes, code paths, tickets, external docs.
   ```

5. Leave `project` unset to use the default (`.lorerc`). **Confirm every saved plan path** back to the user, then **`lore_tree` (kind `plan`)** and list the current plans so the running sequence is visible.
