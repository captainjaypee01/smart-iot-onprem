---
name: Permission Model Column Names
description: The Permission model uses display_name and module, not name — critical for firstOrCreate calls in tests
type: project
---

The `permissions` table has these columns:
- `key` — the permission string like `command.view`
- `display_name` — human-readable label (NOT `name`)
- `module` — module group string (e.g., `'command'`)
- `description` — optional

**Why:** Discovered when writing test helpers. Using `['name' => '...']` would fail silently with a NULL display_name.

**How to apply:** Always use `Permission::firstOrCreate(['key' => 'x.y'], ['display_name' => '...', 'module' => 'x'])` in tests and seeders.
