---
name: ->after() column hint is repo-wide pattern on a PostgreSQL codebase
description: Migrations use ->after() positional hints which are silently ignored on PostgreSQL — recurring LOW-severity warning across modules
type: feedback
---

`->after('column_name')` is a MySQL-only positional hint. On PostgreSQL, Laravel silently ignores it and appends the column at the end of the table. This does not break migrations or queries, but the hint is dead code and misleading.

This pattern appears in multiple migrations throughout the repo (e.g., `2026_03_18_000100_add_fields_to_companies_and_create_company_networks.php`, `2026_04_06_000001_add_gateway_prefix_to_networks_table.php`), so it is an established convention rather than a new deviation.

**Why:** The project uses PostgreSQL exclusively. Column physical ordering is irrelevant on Postgres. The hint was likely carried over from a MySQL habit or a framework scaffold.

**How to apply:** When validating ALTER TABLE migrations for any module, flag `->after()` as a LOW-severity warning (not a failure). Do not mark it as CRITICAL or block the layer check. Note it in the Warnings section with a recommendation to remove for clarity, but acknowledge the implementing agent may leave it for consistency.
