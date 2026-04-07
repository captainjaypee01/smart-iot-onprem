---
name: Networks options endpoint missing gateway_prefix — spec extension required
description: GET /api/v1/networks/options must return gateway_prefix per gateway spec; the field was not added when the gateway module was implemented
type: feedback
---

The gateway module spec requires the existing `GET /api/v1/networks/options` endpoint to be extended with a `gateway_prefix` field per network option. This is needed for the frontend to conditionally show/hide the prefix input in GatewayFormDialog.

As of the Full Module Check (2026-04-06), `NetworkController::options()` still selects only `['id', 'name', 'network_address', 'is_active']` — `gateway_prefix` is absent.

The `NetworkOption` TypeScript interface also lacks `gateway_prefix: string | null`.

**Why:** Cross-module spec extensions to existing endpoints are easy to miss when the gateway module is implemented in isolation. The NetworkController is outside the gateway module boundary.

**How to apply:** When checking gateway-adjacent module specs, always look for "Required Extension" sections that modify endpoints in other modules. Verify both the API controller AND the frontend type are updated.
