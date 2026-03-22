# Feature Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Feature module is the **page/route registry** for the entire system. Each Feature entry represents one navigable page that a user can be granted access to. Features are seeded at deploy time and managed by superadmin (name, order, active status). They are **global** — the same feature list is shared across all companies.

When building a Role, the admin assigns a subset of Features to that role. Users with that role can only navigate to the pages their role has been granted. The sidebar is driven entirely by the authenticated user's role's feature set.

```
Feature ──(role_features)──  Role    which pages a role can visit
Role    ──(role_companies)── Company roles are scoped to a company
Role    ──(role_networks)──  Network which networks a role can see
Role    ──(role_permissions)── Permission what actions a role can perform inside pages
```

---

## How Features, Permissions, and Networks Compose a Role

```
A Role answers three questions:

1. WHICH PAGES can users with this role visit?
   → role_features: the set of Feature keys assigned to this role

2. WHAT ACTIONS can they perform inside those pages?
   → role_permissions: the set of Permission keys assigned to this role

3. WHICH NETWORKS can they see?
   → role_networks: the set of Network IDs assigned to this role
     (constrained to the company's company_networks)

Example:
  Role "Operator" for Company A:
    Features:    dashboard, fire-extinguisher, nodes, alerts
    Permissions: node.view, node.export, alert.acknowledge
    Networks:    Network 1, Network 2

  User A (Operator) → sidebar shows Dashboard, Fire Extinguisher, Nodes, Alerts
                    → can view and export nodes, can acknowledge alerts
                    → sees data from Networks 1 & 2 only
```

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001).

| Endpoint | Who can access |
|----------|---------------|
| `GET /features` (index) | Superadmin only |
| `GET /features/{id}` | Superadmin only |
| `POST /features` | Superadmin only |
| `PUT /features/{id}` | Superadmin only (name, icon, sort_order, is_active) |
| `DELETE /features/{id}` | Superadmin only |
| `PUT /features/reorder` | Superadmin only (bulk sort_order update) |
| `GET /features/options` | All authenticated users |

Features are seeded at deploy time and represent real pages in the codebase. Superadmin may create and delete feature registry entries at runtime. (`key` and `route` remain immutable after creation.)

---

## Migration

```php
// database/migrations/xxxx_create_features_table.php

Schema::create('features', function (Blueprint $table) {
    $table->id();
    $table->string('key', 50)->unique()
        ->comment('Slug matching frontend route key e.g. dashboard, fire-extinguisher');
    $table->string('name', 100)
        ->comment('Display name e.g. Dashboard, Fire Extinguisher');
    $table->string('group', 50)->default('general')
        ->comment('Sidebar group e.g. monitoring, management, admin');
    $table->unsignedSmallInteger('group_order')->default(0)
        ->comment('Controls display order of the GROUP itself in the sidebar. Shared by all features in the same group. Update via PUT /features/reorder-groups.');
    $table->string('route', 100)
        ->comment('Frontend route path e.g. /dashboard');
    $table->string('icon', 50)->nullable()
        ->comment('Lucide-react icon name e.g. LayoutDashboard');
    $table->unsignedSmallInteger('sort_order')->default(0)
        ->comment('Controls sidebar display order WITHIN the group');
    $table->boolean('is_active')->default(true)
        ->comment('Inactive features are hidden from role assignment and sidebar');
    $table->timestamps();
});

// role_features pivot
Schema::create('role_features', function (Blueprint $table) {
    $table->foreignId('role_id')
        ->constrained('roles')
        ->cascadeOnDelete();
    $table->foreignId('feature_id')
        ->constrained('features')
        ->cascadeOnDelete();
    $table->primary(['role_id', 'feature_id']);
});
```

---

## Seeded Features

These are the initial features seeded at deploy time. Superadmin can edit name, icon, sort_order, and is_active — but not key or route (those are code-coupled).

### Group: monitoring (group_order: 1)

| key | name | route | icon | sort_order |
|-----|------|-------|------|------------|
| `dashboard` | Dashboard | `/dashboard` | `LayoutDashboard` | 1 |
| `fire-extinguisher` | Fire Extinguisher | `/fire-extinguisher` | `FlameKindling` | 2 |
| `nodes` | Nodes | `/nodes` | `Cpu` | 3 |
| `alerts` | Alerts | `/alerts` | `BellRing` | 4 |
| `zones` | Zones | `/zones` | `MapPin` | 5 |
| `analytics` | Analytics | `/analytics` | `BarChart3` | 6 |

### Group: reports (group_order: 2)

| key | name | route | icon | sort_order |
|-----|------|-------|------|------------|
| `reports` | Reports | `/reports` | `FileText` | 1 |

### Group: management (group_order: 3)

| key | name | route | icon | sort_order |
|-----|------|-------|------|------------|
| `users` | Users | `/users` | `Users` | 1 |
| `roles` | Roles | `/roles` | `ShieldCheck` | 2 |
| `company-settings` | Company Settings | `/settings/company` | `Building2` | 3 |

### Group: admin (group_order: 99 — superadmin only, never assignable to roles)

| key | name | route | icon | sort_order |
|-----|------|-------|------|------------|
| `companies` | Companies | `/companies` | `Building` | 1 |
| `networks` | Networks | `/networks` | `Network` | 2 |
| `node-types` | Node Types | `/node-types` | `Layers` | 3 |
| `permissions` | Permissions | `/permissions` | `Key` | 4 |
| `features` | Features | `/features` | `LayoutList` | 5 |

**Note on the `admin` group:** These pages are superadmin-only and are never assigned via `role_features`. The frontend guards them directly using `user.is_superadmin`. They exist in the features table for completeness and ordering, but the `/features/options` endpoint excludes the `admin` group from the list returned to non-superadmin users.

---

## Feature Key / Route Rules

- `key` and `route` are **immutable** — they are coupled to actual frontend routes and backend guards. Changing them is a code deployment, not an admin action.
- `name` and `icon` are editable by superadmin (display only, no code impact).
- `sort_order` is editable by superadmin — controls the order of **features within their group**.
- `group_order` is editable by superadmin — controls the order of the **group itself** in the sidebar. Changing one feature's `group_order` updates all features in that group simultaneously (via `PUT /features/reorder-groups`).
- `is_active` is editable by superadmin — deactivating a feature hides it from role assignment and the sidebar globally.
- `group` is **immutable per feature** — it maps to a real sidebar section. Changing an existing feature's group is a code deployment, but superadmin may introduce new group keys by creating new features.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/features | sanctum + superadmin | List all features (grouped, sorted by group_order then sort_order) |
| GET | /api/v1/features/{id} | sanctum + superadmin | Single feature |
| POST | /api/v1/features | sanctum + superadmin | Create a new feature registry entry |
| PUT | /api/v1/features/{id} | sanctum + superadmin | Update name, icon, sort_order, is_active |
| DELETE | /api/v1/features/{id} | sanctum + superadmin | Delete a feature registry entry |
| PUT | /api/v1/features/reorder | sanctum + superadmin | Bulk update sort_order within a group |
| PUT | /api/v1/features/reorder-groups | sanctum + superadmin | Bulk update group_order (reorder groups) |
| GET | /api/v1/features/options | sanctum | Features for role assignment — all auth users |

Creating/deleting feature registry entries is restricted to superadmin.

**Route collision note:** Register `/features/reorder`, `/features/reorder-groups`, and `/features/options` **before** `Route::apiResource`.

---

## GET /api/v1/features — Grouped Response

Used by the Features list page (superadmin) and the Role create/edit page.

```json
{
  "data": [
    {
      "group": "monitoring",
      "label": "Monitoring",
      "features": [
        {
          "id": 1,
          "key": "dashboard",
          "name": "Dashboard",
          "route": "/dashboard",
          "icon": "LayoutDashboard",
          "sort_order": 1,
          "is_active": true
        },
        {
          "id": 2,
          "key": "fire-extinguisher",
          "name": "Fire Extinguisher",
          "route": "/fire-extinguisher",
          "icon": "FlameKindling",
          "sort_order": 2,
          "is_active": true
        }
      ]
    },
    {
      "group": "management",
      "label": "Management",
      "features": [ ... ]
    }
  ]
}
```

The `label` field is computed server-side from a static group-to-label map (not stored in DB).

---

## GET /api/v1/features/options

Used by the Role create/edit form to display the feature assignment checklist.

**Scoping:**
- Returns all active features (`is_active = true`)
- Excludes the `admin` group — those features are never assigned via roles
- Returns grouped structure (same shape as the full index, minus the admin group)

```json
{
  "data": [
    {
      "group": "monitoring",
      "label": "Monitoring",
      "features": [
        { "id": 1, "key": "dashboard", "name": "Dashboard", "icon": "LayoutDashboard" },
        { "id": 2, "key": "fire-extinguisher", "name": "Fire Extinguisher", "icon": "FlameKindling" }
      ]
    }
  ]
}
```

---

## PUT /api/v1/features/{id} — Editable Fields

```json
{
  "name": "string?",
  "icon": "string?",
  "sort_order": "integer?",
  "is_active": "boolean?"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `name` | optional, string, max:100 |
| `icon` | optional, nullable string, max:50 |
| `sort_order` | optional, integer, min:0 |
| `is_active` | optional, boolean |

**Prohibited fields:** `key`, `route`, `group`, and `group_order` — always `prohibited` on single-feature PUT. `group_order` is only updated via `PUT /features/reorder-groups`. Returns `422` if sent.

---

## PUT /api/v1/features/reorder — Bulk Reorder (Features Within a Group)

Superadmin drags to reorder features within a group. Sends updated sort_order for multiple features at once.

```json
{
  "features": [
    { "id": 1, "sort_order": 1 },
    { "id": 3, "sort_order": 2 },
    { "id": 2, "sort_order": 3 }
  ]
}
```

**Validation:**
- `features`: required, array, min 1
- `features.*.id`: required, integer, exists:features,id
- `features.*.sort_order`: required, integer, min:0

**Response:** `200` with updated grouped feature list.

---

## PUT /api/v1/features/reorder-groups — Bulk Reorder (Group Order)

Superadmin drags to reorder entire groups in the sidebar. Updates `group_order` for all features belonging to each group in a single DB transaction.

```json
{
  "groups": [
    { "group": "monitoring", "group_order": 1 },
    { "group": "management", "group_order": 2 },
    { "group": "reports",    "group_order": 3 }
  ]
}
```

**Validation:**
- `groups`: required, array, min 1
- `groups.*.group`: required, string, exists:features,group
- `groups.*.group_order`: required, integer, min:0
- `admin` group is excluded — its `group_order` (99) is never changed via this endpoint

**DB operation:** `UPDATE features SET group_order = ? WHERE group = ?` for each entry. Run in a single transaction.

**Response:** `200` with updated grouped feature list (sorted by new group_order).

---

## Permission Keys for this Module

| Permission key | Enforced in | Purpose |
|----------------|-------------|---------|
| `feature.view` | `FeatureController@index`, `@show` | List and view features |
| `feature.update` | `UpdateFeatureRequest::authorize()` | Edit name, icon, order, active |
| `feature.create` | `StoreFeatureRequest::authorize()` | Create a feature registry entry |
| `feature.delete` | `DeleteFeatureRequest::authorize()` | Delete a feature registry entry |

---

## Business Rules

1. **Create/Delete via API.** Features are seeded by default, but superadmin may create and delete feature registry entries at runtime.
2. **`key` and `route` are immutable.** API returns `422` if either is sent on `PUT`.
3. **`admin` group features are never returned by `/options`.** Role assignment UI never shows them.
4. **`is_active = false` hides a feature globally** — it disappears from the sidebar for all users, and from the role assignment UI. Existing `role_features` rows for that feature are ignored at runtime (the frontend checks `is_active` when building the sidebar).
5. **Reorder is within the group, not across groups.** `sort_order` is relative within a `group`. The API does not validate this but the frontend only allows drag-and-drop within the same group.
6. **Group label is computed server-side** from a static map — not stored in DB. Changing a group label requires a code deployment.

---

## Frontend — Feature Guard (Route Protection)

The frontend uses the authenticated user's feature set to guard routes. This replaces the current `canViewXxx()` permission checks for page-level access.

```ts
// src/hooks/useFeatures.ts

const useFeatures = () => {
  const { user } = useAuthStore();
  // user.features comes from GET /auth/me response — array of feature keys
  // e.g. ["dashboard", "fire-extinguisher", "nodes"]

  const hasFeature = (key: string): boolean => {
    if (user?.is_superadmin) return true; // superadmin bypasses all feature checks
    return user?.features?.includes(key) ?? false;
  };

  return { hasFeature, features: user?.features ?? [] };
};
```

```tsx
// In AppRouter.tsx — feature-gated route
<Route
  path="/nodes"
  element={
    <FeatureRoute featureKey="nodes">
      <NodesPage />
    </FeatureRoute>
  }
/>

// FeatureRoute component in src/routes/FeatureRoute.tsx
const FeatureRoute = ({ featureKey, children }) => {
  const { hasFeature } = useFeatures();
  if (!hasFeature(featureKey)) return <Navigate to="/403" />;
  return children;
};
```

---

## Frontend — Sidebar Generation

The sidebar is no longer a static list with permission checks. It is generated dynamically from the user's assigned features, ordered by `sort_order`, grouped by `group`.

```ts
// user.features from /auth/me now includes full feature objects, not just keys:
// user.features = [
//   { key: "dashboard", name: "Dashboard", route: "/dashboard",
//     icon: "LayoutDashboard", group: "monitoring", sort_order: 1 },
//   { key: "nodes", ... }
// ]
// Sorted and grouped by the API before returning in /auth/me
```

The sidebar renders `user.features` grouped by `group`, in `sort_order` order. No static nav config needed.

---

## Impact on `/auth/me` Response

The `GET /auth/me` response must include the user's features. This is a **breaking change** to the existing auth response.

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@acme.com",
  "is_superadmin": false,
  "company": { "id": 1, "name": "Acme Corp", "code": "ACME" },
  "role": { "id": 1, "name": "Operator" },
  "permissions": ["node.view", "node.export", "alert.acknowledge"],
  "features": [
    { "key": "dashboard",         "name": "Dashboard",        "route": "/dashboard",        "icon": "LayoutDashboard", "group": "monitoring", "sort_order": 1 },
    { "key": "fire-extinguisher", "name": "Fire Extinguisher","route": "/fire-extinguisher","icon": "FlameKindling",   "group": "monitoring", "sort_order": 2 },
    { "key": "nodes",             "name": "Nodes",            "route": "/nodes",            "icon": "Cpu",             "group": "monitoring", "sort_order": 3 }
  ],
  "networks": [
    { "id": 1, "name": "Building A", "network_address": "0xA1B2C3" }
  ]
}
```

**Superadmin:** `features` array contains all active features (including admin group). Sidebar shows everything.

---

## Frontend UI Notes

### Features List Page (Superadmin only)

- Route: `/features` (in the admin group — superadmin guard only, not feature-gated)
- Layout: `DashboardLayout`
- Grouped display using shadcn `Tabs` or section headers per group
- Table columns per group: Sort (drag handle) | Name | Key (monospace badge) | Icon | Route (monospace) | Active (toggle)
- **Drag-to-reorder** within each group — calls `PUT /features/reorder` on drop
- Edit button → `FeatureEditDialog` (name, icon, sort_order, is_active only)
- No Create button · No Delete button
- Active toggle can be toggled inline (calls `PUT /features/{id}` with `is_active`)

### FeatureEditDialog

Simple single-section dialog (no need for multi-section layout):

```tsx
<DialogContent className="w-full max-w-md max-h-[90vh] flex flex-col gap-0">
```

Fields:
- Name (Input)
- Icon (Input — lucide-react icon name, with a small preview of the icon)
- Is Active (Switch)

`key` and `route` are displayed as read-only labels — never in an editable input.

---

## TypeScript Types (`src/types/feature.ts`)

```ts
// src/types/feature.ts

export interface Feature {
  id: number;
  key: string;
  name: string;
  group: string;
  group_order: number;
  route: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

export interface ReorderGroupsPayload {
  groups: { group: string; group_order: number }[];
}

export interface FeatureGroup {
  group: string;
  label: string;
  features: Feature[];
}

export interface FeaturesGroupedResponse {
  data: FeatureGroup[];
}

// Lightweight version returned in /options and in user.features from /auth/me
export interface FeatureSummary {
  key: string;
  name: string;
  route: string;
  icon: string | null;
  group: string;
  sort_order: number;
}

export interface UpdateFeaturePayload {
  name?: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface ReorderFeaturesPayload {
  features: { id: number; sort_order: number }[];
}
```

---

## API File (`src/api/features.ts`)

```ts
// src/api/features.ts
// API functions for Feature module endpoints

import axiosClient from './axiosClient';
import type {
  FeaturesGroupedResponse,
  UpdateFeaturePayload,
  ReorderFeaturesPayload,
} from '@/types/feature';

export const getFeaturesGrouped = async (): Promise<FeaturesGroupedResponse> => {
  const res = await axiosClient.get('/v1/features');
  return res.data;
};

export const getFeatureOptions = async (): Promise<FeaturesGroupedResponse> => {
  const res = await axiosClient.get('/v1/features/options');
  return res.data;
};

export const updateFeature = async (
  id: number,
  payload: UpdateFeaturePayload
): Promise<{ data: Feature }> => {
  const res = await axiosClient.put(`/v1/features/${id}`, payload);
  return res.data;
};

export const reorderFeatures = async (
  payload: ReorderFeaturesPayload
): Promise<FeaturesGroupedResponse> => {
  const res = await axiosClient.put('/v1/features/reorder', payload);
  return res.data;
};

export const reorderFeatureGroups = async (
  payload: ReorderGroupsPayload
): Promise<FeaturesGroupedResponse> => {
  const res = await axiosClient.put('/v1/features/reorder-groups', payload);
  return res.data;
};
```

---

## Checklist Before Implementation

### API
- [ ] Migration: `features` table + `role_features` pivot
- [ ] FeatureSeeder: all features from the seeded features table above
- [ ] `FeatureResource` shape matches contract — includes `group_order` field
- [ ] Grouped response sorted by `group_order` then `sort_order` within group
- [ ] `UpdateFeatureRequest::authorize()` — superadmin only
- [ ] `UpdateFeatureRequest::rules()` — `key`, `route`, `group`, `group_order` are `prohibited`
- [ ] `ReorderFeaturesController` (single-action, ADR-013) — bulk `sort_order` update in one DB call
- [ ] `ReorderGroupsController` (single-action, ADR-013) — updates `group_order` on all features in a group, single transaction
- [ ] `/options` excludes `admin` group features
- [ ] `/options` route registered before `apiResource`
- [ ] `/reorder` and `/reorder-groups` routes registered before `apiResource`
- [ ] `GET /auth/me` updated to include `features` array (sorted by group + sort_order)
- [ ] `GET /auth/me` updated to include `networks` array (from role_networks)
- [ ] PermissionSeeder: add `feature.view`, `feature.update`
- [ ] Feature tests: grouped response shape, options excludes admin group, update name/icon/order, reorder bulk update, 422 on key/route change, 403 for non-superadmin

### Frontend
- [ ] `src/types/feature.ts`
- [ ] `src/api/features.ts`
- [ ] `src/hooks/useFeatures.ts` — `hasFeature(key)` helper, superadmin bypass
- [ ] `src/routes/FeatureRoute.tsx` — route guard component
- [ ] Update `AppRouter.tsx` — wrap feature pages with `<FeatureRoute featureKey="...">`
- [ ] Update sidebar — generate dynamically from `user.features` (grouped + sorted)
- [ ] Remove static nav config entries for feature-gated pages
- [ ] `src/pages/features/FeaturesPage.tsx` — superadmin only, grouped + draggable
- [ ] `src/components/shared/FeatureEditDialog.tsx` — name, icon, is_active only
- [ ] Two-level drag-to-reorder: group-level drag calls `reorderFeatureGroups()`, feature-level drag calls `reorderFeatures()`
- [ ] Inline active toggle on list calls `updateFeature(id, { is_active })`
- [ ] `src/api/features.ts` includes `reorderFeatureGroups` function
- [ ] Update `useAuthStore` — `features: FeatureSummary[]` added to user state
- [ ] Update `src/types/auth.ts` — `User` interface gets `features: FeatureSummary[]` and `networks: NetworkSummary[]`
- [ ] All strings in `src/constants/strings.ts`
- [ ] Dark mode variants on all custom styles

---

## Open Questions

- [ ] Should the `admin` group features appear in the Features list page (superadmin CRUD) even though they can't be assigned to roles? Recommend: yes, show them so superadmin can reorder/rename them, but display a "(Superadmin only)" badge.
- [ ] Drag-and-drop library: shadcn doesn't include DnD. Recommend `@dnd-kit/core` + `@dnd-kit/sortable` — lightweight, accessible, React 19 compatible. Confirm before implementation.
- [ ] When `reorder-groups` is called with a new group_order, confirm the `admin` group (group_order: 99) is always excluded from the payload and never reordered.
- [ ] Should deactivating a feature (`is_active = false`) also remove all existing `role_features` rows for that feature, or just hide it at runtime? Recommend: hide at runtime only — preserves data if the feature is re-activated.
- [ ] `networks` array in `/auth/me` — confirm shape: `{ id, name, network_address }` matching `NetworkSummary`?