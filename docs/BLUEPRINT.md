# Smart IoT On-Prem — System Blueprint

> **Living document.** Update it every time a module is completed, a schema changes, a new ADR is recorded, or a cross-module relationship changes. It is the first file anyone reads before starting work.

---

## What This Document Is

The System Blueprint answers:
- What modules exist and what is their status?
- How does the full data model fit together?
- What cross-module dependencies exist?
- What is the correct implementation order and why?
- What architectural decisions have been made?

It does **not** replace individual module contracts — those are the source of truth for each module's API shape, validation, and frontend behaviour. This document describes the whole system and how the parts connect.

---

## Operating model (current)

The platform is **operator-led**: the deployment owner provisions **companies**, defines **roles** (the bundles of features, permissions, and networks per company), and owns **authorization policy**. **Tenant (company) administrators** may create and manage **users** within their company — typically by assigning people to **roles the operator has already created** — but **creating or editing roles and permission matrices** is handled by the operator, not delegated to tenants in the current product.

**Implications for implementation**

- Role Management in **iot-dashboard** is **superadmin-only** (see `SuperadminOutlet` for `/roles` routes).
- **Delegating role CRUD to company admins** is a **future product decision**. If adopted, it must be updated together: API authorization, `docs/specs/role-module-contract.md`, seeds/permissions, and UI — not in isolation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React SPA (iot-dashboard)               │
│  Cookie Sanctum auth · Tailwind v4 · shadcn/ui          │
│  Zustand · Axios · react-router-dom v7                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS + Session Cookie + CSRF
┌────────────────────────▼────────────────────────────────┐
│               Laravel 12 API (api/)                      │
│  PHP 8.4 · PostgreSQL · Redis · Pest tests              │
│  Actions pattern (ADR-006) · Outbox pattern (ADR-003)   │
└──────┬──────────────────────────────┬───────────────────┘
       │ PostgreSQL                   │ Redis Streams
┌──────▼──────────┐        ┌──────────▼──────────────────┐
│  PostgreSQL 18  │        │  IoT Service (Node/TS)        │
│  All app data   │        │  MQTT ↔ Redis Streams         │
└─────────────────┘        │  Wirepas protobuf topics      │
                           └──────────────────────────────┘
```

---

## Full Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│ companies                                                        │
│  id · name · code(20) · address · contact_email · contact_phone │
│  timezone · logo_path · login_attempts · is_2fa_enforced        │
│  is_demo · is_active_zone · is_active                           │
│  custom_alarm_threshold · custom_alarm_threshold_unit            │
└────────────┬──────────────────────────────────────┬────────────┘
             │ users.company_id                      │ role_companies
             │                                       │
┌────────────▼──────────┐              ┌─────────────▼──────────┐
│ users                  │              │ roles                   │
│  id · uuid · first_name│              │  id · name              │
│  last_name · email     │              │  is_system_role         │
│  username · is_superadmin             └──┬──────┬──────┬───────┘
│  is_active · status    │                 │      │      │
│  company_id (FK)       │          role_  │ role_│ role_│
│  role_id (FK)          │          perms  │ nets │ feats│
└────────────────────────┘                 │      │      │
                                ┌──────────▼┐ ┌───▼──┐ ┌▼──────────────────┐
                                │permissions│ │nets  │ │ features           │
                                │  id · key │ │      │ │  id · key · name   │
                                │  module   │ │  ... │ │  group · group_order│
                                │  display_ │ └──────┘ │  route · icon      │
                                │  name     │          │  sort_order        │
                                └───────────┘          │  is_active         │
                                               ┌───────▼──────────┐
                                               │ networks          │
                                               │  id · name        │
                                               │  network_address  │
                                               │  alarm_threshold  │
                                               │  diagnostic_int   │
                                               │  wirepas_version  │
                                               │  commissioned_date│
                                               │  flags            │
                                               └──────┬────────────┘
                                                      │ network_node_types
                                               ┌──────▼──────────┐
                                               │ node_types       │
                                               │  id · name       │
                                               │  area_id (hex)   │
                                               │  sensor_1..8_    │
                                               │  name/unit       │
                                               └─────────────────┘
```

---

## Pivot Table Registry

All pivots that exist in the DB. **Never create these again — they already exist.**

| Pivot table | Migration file | Columns | Purpose |
|-------------|---------------|---------|---------|
| `role_companies` | `0001_01_01_000006` | `role_id`, `company_id` | Roles scoped to companies |
| `role_permissions` | (permissions migration) | `role_id`, `permission_id` | Roles have permissions |
| `network_node_types` | `0001_01_01_000008` | `network_id`, `node_type_id` | Networks have node types |
| `role_networks` | `0001_01_01_000009` | `role_id`, `network_id` | Roles see specific networks |
| `company_networks` | `2026_03_18_000100_add_fields_to_companies...` | `company_id`, `network_id` | Companies have networks |
| `role_features` | **NEW** (feature module) | `role_id`, `feature_id` | Roles unlock pages/features |

---

## Network Access Control Model

The mechanism that controls which users see which networks:

```
Step 1: Superadmin assigns Networks 1, 2, 3 to Company A
        → company_networks rows: (CompanyA, Net1), (CompanyA, Net2), (CompanyA, Net3)

Step 2: When creating roles for Company A, assign from those networks:
        Role "Operator" → Networks 1 & 2  →  role_networks
        Role "Viewer"   → Network 2 only  →  role_networks

Step 3: Assign roles to users
        User A → Role "Operator"  →  sees Networks 1 & 2
        User B → Role "Viewer"    →  sees Network 2 only
```

**Enforcement rule (API — Role module on POST/PUT):**
When assigning networks to a role, the API validates that every `network_id` in the payload exists in `company_networks` for that role's company. A network not assigned to the company cannot be in any of that company's roles.

---

## Three-Layer Role Access Model

A Role bundles three access layers simultaneously. Every page check, action check, and data filter runs through all three.

```
Role answers three questions:

1. WHICH PAGES can this user visit?
   → role_features  (Feature keys e.g. "dashboard", "nodes", "alerts")

2. WHAT ACTIONS can they perform inside those pages?
   → role_permissions  (Permission keys e.g. "node.view", "node.export")

3. WHICH NETWORKS can they see data from?
   → role_networks  (Network IDs, constrained to company_networks)
```

**Sidebar** — generated dynamically from `user.features` (from `/auth/me`), sorted by `group_order` then `sort_order`.

**Route guard** — `<FeatureRoute featureKey="nodes">` redirects to `/403` if the user's role does not have that feature.

**Action buttons** — gated by `usePermission().hasPermission("node.export")` etc.

**Network data filter** — all IoT data queries are scoped to the network IDs in `role_networks` for the user's role.

---

## Module Registry

| # | Module | Status | Spec file | Notes |
|---|--------|--------|-----------|-------|
| 1 | **Auth** | ✅ Done | `DECISIONS.md` | Cookie Sanctum, SSO, invite flow |
| 2 | **Permission** | ✅ Done | `docs/specs/permission-module-contract.md` | Seeded, grouped by module, keys immutable |
| 3 | **Node Type** | ✅ Done | `docs/specs/node-type-module-contract.md` | Global, 8 sensor slots, superadmin CRUD |
| 4 | **Network** | ✅ Done | `docs/specs/network-module-contract.md` | Superadmin CRUD, address gen, maintenance |
| 5 | **Company** | ✅ Done | `docs/specs/company-module-contract.md` | `company_networks` pivot, superadmin CRUD + company admin self-edit |
| 6 | **Feature** | 🔜 Next | `docs/specs/feature-module-contract.md` | Page registry, seeded, two-level sort (`group_order` + `sort_order`), dynamic sidebar |
| 7 | **Role** | 🔜 Next | `docs/specs/role-module-contract.md` | Bundles features + permissions + networks; `role_features` pivot |
| 8 | **User** | ✅ Done | `docs/specs/user-module-contract.md` | Invite flow, company-scoped, soft delete |
| 9 | **Zone** | 📋 Planned | — | TBD |
| 10 | **Node** | 📋 Planned | — | IoT device, network + node type |
| 11 | **Alert** | 📋 Planned | — | Alarm events from IoT nodes |
| 12 | **Dashboard** | 📋 Planned | — | Main monitoring view |

**Status key:** ✅ Done · 🔜 Next · 📋 Planned · ⚠️ Has breaking change pending · ❌ Deprecated

---

## Migration File Registry

Track every migration file so nothing gets created twice.

| Filename | Creates | Status |
|----------|---------|--------|
| `0001_01_01_000000_create_companies_table.php` | `companies` (base columns) | ✅ Exists |
| `0001_01_01_000001_create_...` | (roles, permissions, users — check your repo) | ✅ Exists |
| `0001_01_01_000006_create_role_companies_table.php` | `role_companies` pivot | ✅ Exists |
| `0001_01_01_000008_create_networks_table.php` | `networks` + `network_node_types` | ✅ Exists |
| `0001_01_01_000009_create_role_networks_table.php` | `role_networks` | ✅ Exists |
| `0001_01_01_000012_create_node_types_table.php` | `node_types` | ✅ Exists |
| `2026_03_18_000100_add_fields_to_companies_and_create_company_networks.php` | Alter `companies` + `company_networks` | ✅ Exists |
| `xxxx_create_role_permissions_table.php` | `role_permissions` | (check repo) |
| `xxxx_create_features_and_role_features_table.php` | `features` + `role_features` pivot | 🔜 Feature module |

---

## Implementation Order

Driven by FK dependencies. Each module requires its dependencies' tables to exist first.

```
Already done:
  node_types          ← no FKs, global reference data
  networks            ← no FKs (network_node_types needs node_types)
  network_node_types  ← needs networks + node_types (in networks migration)
  role_companies      ← needs roles + companies
  role_networks       ← needs roles + networks
  role_permissions    ← needs roles + permissions
  companies (ALTER)   ← add new fields + company_networks pivot
  company_networks    ← needs companies + networks (new pivot)

Next:
  Feature module      ← no FKs on features table; role_features needs roles + features
  Role module         ← needs company_networks (validate role_networks)
                         needs features table (validate role_features)

Planned:
  Zone module         ← TBD
  Node module         ← needs networks + node_types
  Alert module        ← needs nodes
  Dashboard           ← needs all of the above
```

---

## Options Endpoints Registry

`/options` endpoints exist so **other modules** can reference a resource in their forms. The owning module **never** calls its own `/options`.

| Endpoint | Owned by | Used by | Auth required |
|----------|----------|---------|---------------|
| `GET /api/v1/companies/options` | Company | User create/edit form | All auth users |
| `GET /api/v1/roles/options?company_id=N` | Role | User create/edit form | All auth users |
| `GET /api/v1/networks/options` | Network | Company form (assign networks) | Superadmin |
| `GET /api/v1/node-types/options` | Node Type | Network form (assign node types) | All auth users |
| `GET /api/v1/features/options` | Feature | Role form (assign features/pages) | All auth users |
| `GET /api/v1/permissions` (grouped) | Permission | Role form (assign permissions) | All auth users |

---

## Shared Field Formats

These formats are used consistently. Never deviate.

| Field | Format | Example | Where |
|-------|--------|---------|-------|
| `network_address` | `0x` + 6 uppercase hex | `0xA3F2B1` | Network |
| `area_id` (node type) | Raw hex, no prefix, uppercase, max 10 chars | `A1B2C3` | Node Type |
| `company.code` | Uppercase, max 20 chars, regex `/^[A-Z0-9_-]+$/` | `ACME` | Company |
| Dates | ISO8601 string | `2026-01-01T00:00:00+00:00` | All |
| Date only | `YYYY-MM-DD` | `2026-03-20` | Network `commissioned_date` |

---

## Soft Delete vs Hard Delete

| Model | Delete type | Constraint |
|-------|-------------|-----------|
| User | Soft delete (`deleted_at`) | — |
| Company | Hard delete | 409 if has users |
| Node Type | Hard delete | 409 if in `network_node_types` |
| Permission | Hard delete | 409 if in `role_permissions` |
| Network | Hard delete | 409 future (when Nodes module exists) |
| Role | Hard delete | 409 if has users (future) |

---

## Auth Model Summary

### User types

| Type | `is_superadmin` | Access |
|------|----------------|--------|
| Superadmin | `true` | Bypasses all permission checks. Sees all companies, networks, users. |
| Company admin | `false` | Has a role with specific permissions. Scoped to own `company_id`. Sees only their company's networks (filtered by `role_networks`). |
| Standard user | `false` | Has a role with limited permissions. Scoped to company and role's assigned networks. |

### Permission key format

```
module.action   e.g.  user.view  company.update  network.view
```

---

## Frontend Architecture Summary

```
src/
├── api/           One file per domain — axiosClient only, /v1/ prefix
├── components/
│   ├── ui/        shadcn only — never edit
│   └── shared/    DataTableServer, *FormDialog, custom reusables
├── constants/     strings.ts + ALARM_THRESHOLD_UNIT_OPTIONS etc.
├── hooks/         useX.ts + useXPermissions.ts per module
├── pages/         Thin — calls hooks only, no logic
├── routes/        AppRouter.tsx + PrivateRoute.tsx
├── store/         Zustand: useAuthStore only
└── types/         One .ts file per module
```

### Non-negotiable UI patterns

| Rule | Detail |
|------|--------|
| List pages | `DataTableServer` only — never a custom table |
| Dialog structure | `w-full max-w-2xl max-h-[90vh] flex flex-col` |
| Dialog body | `overflow-y-auto flex-1` — scrollable |
| Dialog header/footer | `shrink-0` — fixed while body scrolls |
| Form grids | `grid-cols-1 sm:grid-cols-2 gap-4` — never `grid-cols-2` alone |
| Options calls | Inside the form that needs them — never on the list page |
| Toasts | Sonner only — `toast.success/error/warning/info` |
| Submit state | Disabled + spinner while request is in-flight — always |
| Table scroll | `overflow-x-auto` wrapper — always |

---

## Known Breaking Changes Log

| Date | Change | Affected files |
|------|--------|---------------|
| 2026-03 | `network_node_types` pivot: `node_type_key` string → `node_type_id` FK | Network migration, Network model |
| 2026-03 | `NetworkResource.node_types`: string array → `[{id, name, area_id}]` objects | network.ts types, NetworkFormDialog |
| 2026-03 | `NODE_TYPE_LABELS`, `NODE_TYPE_OPTIONS`, `NodeTypeKey` removed from constants | src/constants/nodeTypes.ts, all consumers |
| 2026-03 | `GET /auth/me` now returns `features: FeatureSummary[]` and `networks: NetworkSummary[]` — breaking change to auth response | src/types/auth.ts, useAuthStore, sidebar |
| 2026-03 | Sidebar now generated dynamically from `user.features` — static nav config for feature-gated pages removed | src/config/nav.ts or equivalent, AppRouter.tsx |

---

## Docker Environment Commands

| Env | Command |
|-----|---------|
| Dev | `docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d --build` |
| UAT | `docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env.uat up -d --build` |
| Prod | `docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build` |

Shortcuts: `make dev` · `make uat` · `make prod` · `make logs SERVICE=api` · `make shell-api`

---

## How to Keep This Document Current

After completing any module:

1. Change its **status** in the Module Registry (`🔜` → `✅`)
2. Add any **new pivot tables** to the Pivot Table Registry and Data Model
3. Add any **new `/options` endpoints** to the Options Endpoints Registry
4. Record any **breaking changes** in the Breaking Changes Log
5. Add new **migration files** to the Migration File Registry
6. Update **Implementation Order** if a new dependency was discovered
7. Commit this file in the **same PR** as the module implementation

After completing the **Feature** module, update entries 1, 2, 3, 4, 5, and 6 above.
After completing the **Role** module, update entries 1, 3, and 4 above.