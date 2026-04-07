---
name: Gateway Module
description: Key decisions for gateway-module-contract.md — gateway_id generation, sink_id counter, status derivation, network_prefix placement
type: project
---

The Gateway module spec was written at `docs/specs/gateway-module-contract.md` on 2026-04-06.

**Why:** Wirepas gateways are physical hardware devices that must be registered and tracked in the platform. The module enables CRUD management and command dispatch to gateways via the existing outbox/commands pipeline.

**Key decisions:**
- `gateway_prefix` is stored on the `networks` table (nullable, globally unique, set once on first gateway creation for that network, then immutable). Not on a separate table.
- `sink_id` is a zero-padded 2-digit string (e.g. "01", "02"). The counter includes soft-deleted gateways to prevent reuse of historic `gateway_id` values that appear in MQTT topics and command audit trail.
- `gateway_id = "{gateway_prefix}_{sink_id}"` — auto-generated, never editable, unique across the system.
- `status` (online/offline/unknown) is NOT stored in the DB. It is derived in `GatewayResource` from `last_seen_at` vs. a configurable threshold (default 10 min, stored as `GATEWAY_ONLINE_THRESHOLD_MINUTES` in `config/iot.php`).
- `last_seen_at` is updated by an internal endpoint `PATCH /api/v1/internal/gateways/{id}/last-seen` — called by the IoT service on every incoming MQTT message from that gateway.
- Gateway commands write to the shared `commands` table with `type = 'get_configs'` etc. and `message_status = 7` (Gateway Responded). The `node_address` column on `commands` stores `gateway.gateway_id`. The `reqId` in MQTT payload = `commands.request_id`.
- Soft delete is required for gateways. Hard delete is forbidden — it would break `sink_id` counter integrity.
- The `network_id` FK on `gateways` is ON DELETE RESTRICT — cannot delete a network while gateways exist.
- `GET /api/v1/networks/options` must be extended to include `gateway_prefix` (nullable) per network option, so the frontend can conditionally show the prefix input field.
- This module is superadmin-only. No company admin or standard user has any access.
- Permissions: `gateway.view`, `gateway.create`, `gateway.update`, `gateway.delete`, `gateway.send_command`.
- Toggle test mode (`is_test_mode`) uses the same `PATCH /api/v1/gateways/{id}` endpoint — no separate toggle endpoint.

**How to apply:** When implementing or referencing this module, check that `sink_id` counter uses `withTrashed()`, that the `networks` table has the `gateway_prefix` migration applied first, and that gateway commands always set `message_status = 7`.
