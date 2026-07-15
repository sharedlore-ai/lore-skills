---
name: log
description: Quickly log a note, decision, or finding to the team's SharedLore.
argument-hint: "<note>"
---

# /log

Quickly record a note, decision, or finding into the team's shared lore, mirroring the Obsidian `/log` ritual. A log is a lightweight structured document (kind `log`) - lower ceremony than an ADR.

This command requires the `sharedlore` MCP server to be configured.

## Do this

1. Take the note from `$ARGUMENTS` (or the gist of the current conversation) and write a short, clear Markdown `body`.
2. Choose a node `path` (e.g. `log/2026-06-25-rate-limit-tweak`) and a concise `title`.
3. Call the **`lore_log`** MCP tool with `path`, `title`, and `body` (leave `project` unset to use the default).
4. Confirm the saved log path back to the user.
