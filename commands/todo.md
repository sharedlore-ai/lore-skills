---
name: todo
description: Add a TODO item to the team's SharedLore - or, with no argument, list the open ones.
argument-hint: "[todo]"
---

# /todo

Add a pending TODO into the team's shared lore, mirroring the Obsidian `/todo` ritual. A TODO is a small, structured document (kind `todo`) the team can find later via on-demand recall. **One TODO per node.** Write in English.

This command requires the `sharedlore` MCP server to be configured.

## With an argument — add a TODO

1. Take the task from `$ARGUMENTS` (or the conversation) and write a clear `body`: **what needs doing**, the **context to pick it up cold**, and any **acceptance / next step**. Keep file references (`@app/models/node.rb`) in the body.
2. Choose a node `path` **`todo/<YYYY-MM-DD>-<short-kebab-slug>`** and a short `title`. Derive the slug from the first few meaningful words (lowercase, alphanumerics + hyphens, ~50 chars); **strip `@path/to/file` references from the slug** (keep them in the body). If that path already exists, append `-2`, `-3`, … .
3. Call the **`lore_todo`** MCP tool with `path`, `title`, and `body` (leave `project` unset to use the default).
4. **Confirm** the saved TODO path, then show the current count of open TODOs (`lore_tree` / `lore_search` with `kind: todo`).

## With no argument — list open TODOs

1. **`lore_tree`** (or `lore_search`) with `kind: todo` to list the project's TODO nodes.
2. Show a bullet per TODO — title and date — so the user sees the open list at a glance. If there are none, tell them the TODO list is empty.

> If `$ARGUMENTS` is empty **and** the conversation surfaced no concrete task, default to the **list** behavior rather than inventing a TODO.
