# Node Decommission Module — Test Report

**Date:** 2026-04-08
**Module:** Node Decommission
**Spec:** `docs/specs/node-decommission-module-contract.md`

---

## Test Results

### API (Laravel Pest)

| Suite | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| `NodeDecommissionTest` | 39 | 39 | 0 | 0 |

**Assertions:** 121 passed
**Duration:** ~39s

All 39 tests passed:
- `GET /api/v1/node-decommission/nodes` — 8 tests (list, excludes decommissioned, search filter, 422 missing network, 403 no permission, 422 wrong network, includes latest_log, 401 unauthenticated)
- `GET /api/v1/node-decommission/history` — 4 tests (paginated, filter by status, 422 missing network, 403)
- `POST /{node}/decommission` — 8 tests (creates pending, 409 duplicate, 422 already decommissioned, 422 payload mismatch, 422 validation, 403, normalises payload)
- `POST /{node}/resend` — 4 tests (resets failed log, 404 no failed log, 422 decommissioned, 403)
- `POST /{node}/verify` — 4 tests (sets verification fields, 404 no pending log, 422 decommissioned, 403)
- `POST /{node}/manual` — 4 tests (creates manual log, 422 decommissioned, 403, allows manual on failed)
- `PATCH /internal/node-decommission/{log}/status` — 7 tests (transitions pending→verified, pending→failed, idempotent on verified, 409 on manual, decommission ACK no-op, 401 no token, 404 not found, 422 validation)

### Full Suite Regression Check

| Suite | Result |
|-------|--------|
| `NodeDecommissionTest` | PASS (39/39) |
| `AuthTest` | PASS |
| `CommandConsoleTest` | PASS |
| `InternalCommandStatusTest` | PASS |
| `FeatureApiTest` | PASS |
| `GatewayInternalTest` | PASS |
| `NodeTypeTest` | PASS |
| `PermissionApiTest` | PASS |
| `ListProvisioningBatchesTest` | PASS |
| `ResendProvisioningNodeTest` | PASS |
| `ShowProvisioningBatchTest` | PASS |
| `UserManagementTest` | PASS |
| `GatewayCommandTest` | FAIL (pre-existing) |
| `GatewayTest` | FAIL (pre-existing) |
| `NetworkTest` | FAIL (pre-existing) |
| `StoreProvisioningBatchTest` | FAIL (pre-existing) |
| `RoleTest` | FAIL (pre-existing) |

**Pre-existing failures:** 21 tests across Gateway, Network, Provisioning, and Role suites — all existed before this module was added. Zero regressions introduced.

---

## Frontend (TypeScript)

**TypeScript check:** `npx tsc --noEmit -p tsconfig.app.json`

**Result:** No errors in any Node Decommission files.

All TypeScript errors in the output are pre-existing issues in unrelated files:
- `src/mocks/` (mock data with outdated Node shape)
- `src/hooks/useDashboard.ts`, `useFireExtinguisher.ts`, `useCompanies.ts`
- `src/pages/networks/NetworksPage.tsx`, `NodeTypesPage.tsx`, `FireExtinguisherPage.tsx`
- `src/components/ui/combobox.tsx`, `SidebarNavItem.tsx`
- `src/pages/auth/SetPasswordPage.tsx`

**Node Decommission files — zero TypeScript errors:**
- `src/types/nodeDecommission.ts` ✅
- `src/api/nodeDecommission.ts` ✅
- `src/hooks/useNodeDecommissionPermissions.ts` ✅
- `src/hooks/useNodeDecommission.ts` ✅
- `src/pages/node-decommission/NodeDecommissionPage.tsx` ✅
- `src/pages/node-decommission/NodeDecommissionDialog.tsx` ✅
- `src/pages/node-decommission/ManualDecommissionDialog.tsx` ✅

---

## Spec Compliance

### API Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| GET | `/api/v1/node-decommission/nodes` | Sanctum | ✅ |
| GET | `/api/v1/node-decommission/history` | Sanctum | ✅ |
| POST | `/api/v1/node-decommission/{node}/decommission` | Sanctum | ✅ |
| POST | `/api/v1/node-decommission/{node}/resend` | Sanctum | ✅ |
| POST | `/api/v1/node-decommission/{node}/verify` | Sanctum | ✅ |
| POST | `/api/v1/node-decommission/{node}/manual` | Sanctum | ✅ |
| PATCH | `/api/v1/internal/node-decommission/{log}/status` | X-Internal-Token | ✅ |

### Permissions (seeded)

| Key | Module | Status |
|-----|--------|--------|
| `node_decommission.view` | `node_decommission` | ✅ |
| `node_decommission.decommission` | `node_decommission` | ✅ |
| `node_decommission.verify` | `node_decommission` | ✅ |
| `node_decommission.manual_decommission` | `node_decommission` | ✅ |

### State Machine

| Transition | Status |
|------------|--------|
| `pending` on decommission command sent | ✅ |
| `pending` reset on verify (timer refreshed) | ✅ |
| `verified` on internal ACK success (verify type) | ✅ |
| `failed` on internal ACK error | ✅ |
| `pending` on resend (from failed) | ✅ |
| `manual` on manual decommission | ✅ |
| Idempotent on `verified` → returns 200 no-op | ✅ |
| 409 on `manual` when ACK arrives | ✅ |

### Frontend

| Check | Status |
|-------|--------|
| Route `/node-decommission` registered | ✅ |
| Feature key `node_decommission` on route | ✅ |
| Sidebar entry with `ServerCrash` icon | ✅ |
| `DataTableServer` used for both tables | ✅ |
| No hardcoded strings (uses `NODE_DECOMMISSION_STRINGS`) | ✅ |
| Dialogs use spec-required CSS classes | ✅ |
| Submit buttons disabled + spinner during mutations | ✅ |
| History refresh button with 5-second cooldown | ✅ |
| Status badges for node + log statuses | ✅ |
| `verification_timed_out` computed attribute used | ✅ |

---

## Issues Found & Fixed

None — all layers implemented cleanly on first pass.

---

## Open Items

1. **Dispatch pipeline not implemented (by design):** Commands are recorded in `node_decommission_logs` but not dispatched to the IoT service via Redis Streams / MQTT. This is intentional per spec — integration deferred until the dispatch architecture is finalised.
2. **Permission role assignment pending:** Which named roles (beyond superadmin bypass) receive `node_decommission.*` keys is a pending product decision. Currently only superadmins can access this module via bypass.
3. **`node_type_id` filter:** The spec mentions filtering nodes by `node_type_id` via `network_node_types`, but per-node type is stored on `node_configs` (linked via `node_config_id`). The implementation uses `nodeConfig.node_type_id` — a more accurate path. Nodes without a config will be excluded when this filter is active.
