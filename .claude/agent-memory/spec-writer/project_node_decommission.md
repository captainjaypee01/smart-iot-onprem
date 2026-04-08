---
name: Node Decommission Module
description: Key decisions for node-decommission-module-contract.md — status-in-place (no delete), dual packet_id columns, verification expiry at read time, no dispatch in v1
type: project
---

Key decisions recorded for the Node Decommission module spec:

- **No soft delete on nodes.** Decommissioning sets `nodes.status = 'decommissioned'` in-place. Rows are never deleted because nodes may be reprovisioned.
- **`node_decommission_logs` is separate from `commands`.** The commands table is for send_data and gateway dispatch flows. Decommission has its own audit table with different state machine.
- **Dual packet_id columns.** `packet_id` tracks the decommission command; `verification_packet_id` tracks the most recent verify command. Same 2-byte random hex generation logic as commands table.
- **Verification expiry is read-time only.** `verification_expires_at` is set to `sent_at + 2 minutes`. No scheduled job transitions status — `verification_timed_out` is a computed attribute on the resource. Status only changes via internal ACK endpoint.
- **No IoT dispatch in v1.** The API records decommission log entries but no outbox events are written. Dispatch integration is deferred to a future phase.
- **Internal ACK endpoint uses `command_type` field.** The IoT service must specify `command_type: 'decommission'|'verify'` so the API can apply the correct state transition (decommission ACK success alone does not set status to verified — only verify ACK success does).
- **Manual decommission coexists with pending logs.** If a pending log exists when manual is called, both records remain. Manual takes effect immediately regardless.
- **Permission keys:** `node_decommission.view`, `node_decommission.decommission`, `node_decommission.verify`, `node_decommission.manual_decommission` — seeded under `module = 'node_decommission'`. Role assignment is an open question.
- **Resend uses `node_decommission.verify` permission** (not a separate resend permission).
- **Network picker is step 1** on the page (separate network selection before node list renders — not a separate route, just page-level state).
- **`nodes.status` column added to existing migration** `0001_01_01_000014_create_nodes_table.php` — database can be migrated fresh.

**Why:** Decommissioning has different lifecycle semantics from command dispatch (verify step, expiry, manual override). Keeping it in a separate table avoids polluting the `commands` audit trail with non-dispatch records.

**How to apply:** When referencing the nodes table, always check if the `status` column is expected. When writing the NodeDecommissionLog resource, always include `verification_timed_out` as a computed field.
