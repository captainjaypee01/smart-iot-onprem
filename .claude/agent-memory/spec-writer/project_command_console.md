---
name: Command Console Module
description: Key decisions and conventions established for the Command Console module spec (command-module-contract.md)
type: project
---

The Command Console module spec was written at `docs/specs/command-module-contract.md` on 2026-04-01.

**Why:** The `commands` table is a shared audit trail across modules. The Command Console is the user-facing send interface for `send_data` type only. Other modules (Node Provisioning, future OTAP modules) also write to `commands`.

**Key decisions:**
- `processing_status` (tinyint 1–4) and `message_status` (tinyint 1–10) are separate columns, not the legacy `status` string column.
- The existing `status` string column is retained for backward compatibility with Node Provisioning — a follow-up migration should consolidate. Command Console writes only `processing_status`/`message_status`.
- `node_address` format: uppercase hex, no prefix, max 10 chars — shared format across Commands, Nodes, and Provisioning. Documented in BLUEPRINT.md Shared Field Formats.
- `request_id` is always API-generated (random large BIGINT, ~4 billion range). Frontend never supplies it.
- `include_tracking_id` (boolean) is the frontend field name; API maps it to `no_packet_id` (inverse).
- `retry_by = NULL` means system/scheduled job retry; a user ID means manual resend via the API.
- History table excludes `type = 'node_provisioning'` — Node Provisioning has its own history view.
- No delete endpoint exists or will be built. Commands are permanent audit records.
- Internal status update endpoint: `PATCH /api/v1/internal/commands/{id}/status` — requires `X-Internal-Token`, not Sanctum. Doubles as QA test utility.
- Retry job: Laravel scheduled job every 5 minutes, max 3 retries, then `processing_status=4` (Failed).
- Permissions: `command.view` (list history) and `command.create` (send + resend own commands).
- Resend ownership: users can only resend their own commands (`created_by = auth()->id()`); superadmins can resend any.

**How to apply:** When implementing the Command Console or any module that writes to `commands`, check this spec and the migration note about `status` vs `processing_status` coexistence.
