# Agent Memory Index

- [Codebase Patterns](codebase_patterns.md) — Key architectural patterns: Actions, DTOs, Resources, Policies, Outbox, route file structure
- [Permission Model](permission_model.md) — Permission table uses `display_name` and `module` columns (not `name`)
- [User Model](user_model.md) — User PK is integer `id` (hidden from serialization), `uuid` for external refs, `is_superadmin` boolean
