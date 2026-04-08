---
name: Node Decommission module
description: File locations, permission keys, feature key, and design decisions for the Node Decommission frontend module
type: project
---

Node Decommission frontend module is implemented and type-clean as of 2026-04-08.

Feature key: `node_decommission`
Route: `/node-decommission` (single page, no sub-routes — network picker is inline on the page)

Permission keys (from spec):
- `node_decommission.view` → `canViewNodeDecommission()`
- `node_decommission.decommission` → `canDecommissionNode()`
- `node_decommission.verify` → `canVerifyDecommission()`
- `node_decommission.manual_decommission` → `canManualDecommission()`

Files created:
- `src/types/nodeDecommission.ts`
- `src/api/nodeDecommission.ts`
- `src/hooks/useNodeDecommissionPermissions.ts`
- `src/hooks/useNodeDecommission.ts`
- `src/pages/node-decommission/NodeDecommissionPage.tsx`
- `src/pages/node-decommission/NodeDecommissionDialog.tsx`
- `src/pages/node-decommission/ManualDecommissionDialog.tsx`

Files modified:
- `src/constants/strings.ts` — added `NODE_DECOMMISSION_STRINGS` at end of file
- `src/routes/AppRouter.tsx` — added lazy import + FeatureRoute for `/node-decommission`
- `src/config/nav.ts` — added `ServerCrash` icon import, `NODE_DECOMMISSION_STRINGS` import, nav entry

Design decisions:
- Network picker is inline on the page (a Select component), NOT a separate route. Spec specifies `/node-decommission` as a single standalone route.
- Node list and history tables only render after a network is selected (guarded by `isNetworkSelected`).
- History refresh has a 5-second cooldown using a local `useCooldown` helper inside the page file.
- Verify and Resend actions are inline buttons (no dialog) with per-row loading state tracked by `verifyingNodeId`/`resendingNodeId` state.
- `useDecommissionNodes` and `useDecommissionHistory` are called unconditionally but with `network_id: 0` as placeholder when no network is selected — the hooks always run but the data is ignored. This avoids conditional hook calls.
- The sidebar entry uses `permission: "node_decommission.view"` + `featureKey: "node_decommission"` — same pattern as gateway.

**Why:** `node_decommission.view` is not a superadmin-only permission (unlike provisioning which is superadmin-only). Access is role-based via the permission+feature system.
**How to apply:** Follow Gateway module pattern (not SuperadminOutlet) when adding similar role-based pages.
