---
name: User Model Structure
description: User PK is integer id (hidden), uuid for external refs, role->networks() for RBAC scoping
type: project
---

Key facts about the User model:
- PK is integer `id` — hidden from JSON serialization
- `uuid` field for external references (invite URLs, API responses via UserResource)
- `is_superadmin` boolean — bypasses all permission checks
- `hasPermission('key')` — checks role->permissions() with superadmin bypass
- `role->networks()` via `role_networks` pivot — used for network scoping in Command Console
- `company_id`, `role_id` — nullable for superadmins

**How to apply:** When building network-scoped queries for non-superadmins, use `$user->role?->networks()->pluck('networks.id')`.
