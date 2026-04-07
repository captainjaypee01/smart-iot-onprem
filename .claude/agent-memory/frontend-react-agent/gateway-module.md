---
name: Gateway Settings module
description: File locations, permission keys, feature key, and key decisions for the Gateway Settings frontend module
type: project
---

Gateway Settings is a superadmin-only module (gateway-module-contract.md).

**Feature key:** `gateway_settings` (used in FeatureRoute and nav.ts)

**Permission keys:** `gateway.view`, `gateway.create`, `gateway.update`, `gateway.delete`, `gateway.send_command`

**Module files:**
- `src/types/gateway.ts` — all Gateway types
- `src/api/gateways.ts` — API functions using `axiosClient`
- `src/hooks/useGateways.ts` — list, detail, create, update, delete, sendCommand hooks
- `src/hooks/useGatewayPermissions.ts` — module-specific permission helpers
- `src/pages/gateways/GatewayListPage.tsx` — list with DataTableServer, filters, CRUD
- `src/pages/gateways/GatewayDetailPage.tsx` — single gateway info card + actions
- `src/pages/gateways/GatewayFormDialog.tsx` — create/edit dialog
- `src/pages/gateways/DeleteGatewayDialog.tsx` — confirm delete
- `src/pages/gateways/SendGatewayCommandDialog.tsx` — 2-step (select → confirm) command dialog

**Routes:** `/gateways` and `/gateways/:id` — inside `SuperadminOutlet`, wrapped with `FeatureRoute featureKey="gateway_settings"`

**Sidebar:** Added to "Superadmin" group in `src/config/nav.ts` with `superadminOnly: true`, `featureKey: "gateway_settings"`, `permission: "gateway.view"`, using `Router` icon from lucide-react.

**Key decisions:**
- `status` is derived at query time from `last_seen_at` — not stored in DB
- `gateway_prefix` is only shown in create form; API silently ignores it if network already has one
- `send_command` response type is `CommandRecord` from `@/types/command`
- `Alert` shadcn component does NOT exist in this project — use a div with Tailwind classes for alert banners
- Pre-existing typecheck errors exist in `src/mocks/`, `src/pages/networks/NetworksPage.tsx`, and a few other files — not caused by gateway module

**Why:** - **How to apply:** When asked to add gateway features, all files are in place.
