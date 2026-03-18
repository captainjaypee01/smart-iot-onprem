# Node Type Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Node Type module defines the categories of IoT nodes that can be deployed in a network. Each node type describes a physical device (e.g. Fire Extinguisher, Smoke Detector) and declares up to **8 sensor slots** — each slot has a name and an optional unit (e.g. `Temperature` / `°C`). Node types are **global** — shared across all companies and networks. This module is **superadmin-only** for CRUD; the `/options` endpoint is accessible to all authenticated users.

```
NodeType  ──(network_node_types)──  Network
NodeType  ──(node.node_type_id)──   Node (IoT device)
```

---

## ⚠ Breaking Change — Network Module Contract Update

> The `network_node_types` pivot must be updated simultaneously with this spec.
> The `node_types` field in `NetworkResource` changes shape. The updates below supersede the relevant sections of the Network Module Contract.

### Migration delta for `network_node_types`

Replace `node_type_key` (string) with `node_type_id` (FK to `node_types`).

> **Dev environments:** Acceptable to drop and recreate both tables rather than running the multi-step migration.

```php
// New migration: add_node_type_id_to_network_node_types_table.php

// Step 1 — add FK column (nullable first to allow backfill)
Schema::table('network_node_types', function (Blueprint $table) {
    $table->foreignId('node_type_id')
        ->nullable()
        ->constrained('node_types')
        ->cascadeOnDelete();
});

// Step 2 — backfill if dev data exists (match by name or slug)

// Step 3 — drop old string column and old primary key
Schema::table('network_node_types', function (Blueprint $table) {
    $table->dropColumn('node_type_key');
    $table->dropPrimary(); // was ['network_id', 'node_type_key']
});

// Step 4 — add new composite PK and make FK non-nullable
Schema::table('network_node_types', function (Blueprint $table) {
    $table->primary(['network_id', 'node_type_id']);
    // Make non-nullable via separate statement or fresh migration
});
```

### Updated `NetworkResource` — `node_types` field

**Old shape (string enum keys — REMOVE):**
```json
"node_types": ["FIRE_EXTINGUISHER", "SMOKE_DETECTOR"]
```

**New shape (objects from `node_types` table — USE THIS):**
```json
"node_types": [
  { "id": 1, "name": "Fire Extinguisher", "area_id": "A1B2C3" },
  { "id": 3, "name": "Smoke Detector",    "area_id": "D4E5F6" }
]
```

### Updated TypeScript — `src/types/network.ts`

```ts
// ADD this interface:
export interface NetworkNodeType {
  id: number;
  name: string;
  area_id: string;
}

// In Network interface — REPLACE:
//   node_types: NodeTypeKey[];
// WITH:
  node_types: NetworkNodeType[];

// In StoreNetworkPayload / UpdateNetworkPayload — REPLACE:
//   node_types?: NodeTypeKey[];
// WITH:
  node_types?: number[];  // array of node_type_id values
```

### Constants cleanup — `src/constants/nodeTypes.ts`

Remove these exports (placeholders for the old enum approach):
```ts
// DELETE:
export const NODE_TYPE_LABELS   // was static map
export const NODE_TYPE_OPTIONS  // was derived from NODE_TYPE_LABELS
// also remove: NodeTypeKey type import/re-export
```

`DIAGNOSTIC_INTERVAL_OPTIONS`, `ALARM_THRESHOLD_UNIT_OPTIONS`, and `WIREPAS_VERSION_OPTIONS` remain unchanged.

Node type options are now fetched at runtime via `GET /api/v1/node-types/options`.

---

## Auth Mechanism

Same as all other modules — cookie-based Sanctum (ADR-001).
- **CRUD endpoints** (`index`, `show`, `store`, `update`, `destroy`): require `is_superadmin = true`. Non-superadmin receives `403`.
- **`/options` endpoint**: requires `auth:sanctum` only — accessible to all authenticated users.

---

## Migration (Keep As-Is — No Changes)

The existing migration is correct. No modifications required.

```
node_types
├── id
├── name              string       — display name e.g. "Fire Extinguisher"
├── area_id           string(10), unique — raw hex, no prefix, stored uppercase e.g. "A1B2C3"
├── description       text, nullable
├── sensor_1_name     string, nullable
├── sensor_1_unit     string, nullable
├── sensor_2_name     string, nullable
├── sensor_2_unit     string, nullable
│   ... (slots 3–7 same pattern)
├── sensor_8_name     string, nullable
├── sensor_8_unit     string, nullable
└── timestamps
```

**Schema design notes:**
- **8 sensor slots is the hard maximum.** The flat column design is intentional — no separate sensors table.
- A sensor slot is **defined** when `sensor_N_name` is not null. `sensor_N_unit` is optional even when name is set.
- Slots must be filled **contiguously from slot 1** — slot N cannot be set if slot N-1 is empty.
- Raw flat columns are **never exposed** in the API response — the `sensors` array is the canonical shape.

---

## Area ID Format

| Detail | Value |
|--------|-------|
| Format | Raw hex string — **no `0x` prefix** |
| Characters | Hexadecimal only: `0-9`, `a-f`, `A-F` |
| Max length | 10 characters (string(10) column) |
| Storage | Normalised to **uppercase** |
| Example | Input `abc123` → stored and returned as `ABC123` |
| Uniqueness | Unique constraint on `area_id` column |
| Entry | **Manual only** — no auto-generate. Maps to a fixed mesh-level identifier defined by the hardware vendor. |

**Regex for validation:** `/^[0-9A-Fa-f]{1,10}$/`

> Note: this format is intentionally different from `network_address` which uses the `0x` prefix. `area_id` is a raw hex identifier only.

---

## Sensor Slot Rules

| Rule | Detail |
|------|--------|
| Max slots | 8 (hard limit — schema enforces via flat columns) |
| Min slots | 0 — a node type can have no sensors |
| Fill order | Contiguous from slot 1. Slot N cannot be set if slot N-1 is empty. API enforces; UI enforces naturally. |
| `sensor_N_name` | Required to define a slot. Max 100 chars. |
| `sensor_N_unit` | Optional within a defined slot. Max 50 chars. Can be `null` (binary / on-off sensors). |
| Clearing a slot | Set `sensor_N_name` to `null`. API cascade-clears all higher-numbered slots. |

**Cascade-clear example:** If a PUT sets `sensor_3_name: null`, the API automatically clears slots 3–8, even if the payload specified values for slots 4–8.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/node-types | sanctum + superadmin | List node types (paginated) |
| GET | /api/v1/node-types/{id} | sanctum + superadmin | Single node type |
| POST | /api/v1/node-types | sanctum + superadmin | Create node type |
| PUT | /api/v1/node-types/{id} | sanctum + superadmin | Update node type |
| DELETE | /api/v1/node-types/{id} | sanctum + superadmin | Delete (if not in use) |
| GET | /api/v1/node-types/options | **sanctum only** | Flat list for dropdowns — all authenticated users |

**Notes:**
- `/options` is **not** superadmin-gated. Non-superadmin roles (e.g. company admin configuring a network) need to select from available node types.
- Node types are global — no company scoping on any endpoint.

---

## GET /api/v1/node-types/options

Accessible to all authenticated users. Used by the Network form's node type multi-select.

```json
{
  "data": [
    { "id": 1, "name": "Fire Extinguisher", "area_id": "A1B2C3" },
    { "id": 2, "name": "Temperature Sensor", "area_id": "D4E5F6" }
  ]
}
```

---

## Pagination (GET /api/v1/node-types)

Accepts `?page` and `?per_page` (1–100, default 15).

| Query param | Type | Description |
|-------------|------|-------------|
| `search` | string | Full-text on `name`, `area_id`, `description` |

---

## API Response Shape (NodeTypeResource)

The API must produce exactly this shape. Raw flat columns (`sensor_1_name`, etc.) are **never exposed**.

```json
{
  "id": 1,
  "name": "Fire Extinguisher",
  "area_id": "A1B2C3",
  "description": "Monitors pressure and temperature of fire extinguisher units.",
  "sensors": [
    { "slot": 1, "name": "Pressure",    "unit": "bar" },
    { "slot": 2, "name": "Temperature", "unit": "°C"  },
    { "slot": 3, "name": "Tilt",        "unit": null  }
  ],
  "sensor_count": 3,
  "created_at": "2026-01-01T00:00:00+00:00",
  "updated_at": "2026-01-01T00:00:00+00:00"
}
```

**Field notes:**
- `sensors` — array of **defined slots only** (where `sensor_N_name` is not null), ordered by slot ascending. Empty slots are excluded.
- `sensor_count` — count of defined slots. Always equals `sensors.length`. Convenience field.
- `slot` — 1-indexed. Frontend must use the `slot` field — never assume array index equals slot number.
- `unit` — can be `null` even within a defined slot (binary sensors).

---

## Request Payloads

### POST /api/v1/node-types

```json
{
  "name": "string",
  "area_id": "string",
  "description": "string | null",
  "sensors": [
    { "name": "Pressure",    "unit": "bar" },
    { "name": "Temperature", "unit": "°C"  },
    { "name": "Tilt",        "unit": null  }
  ]
}
```

**Sensor array → flat column mapping** (Action responsibility):

`StoreNodeTypeAction` maps `sensors[0]` → `sensor_1_name`/`sensor_1_unit`, `sensors[1]` → `sensor_2_name`/`sensor_2_unit`, and so on. Slots beyond the array length are set to `null`.

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | required, string, max:255, unique:node_types |
| `area_id` | required, string, regex:`/^[0-9A-Fa-f]{1,10}$/`, unique:node_types |
| `description` | optional, nullable |
| `sensors` | optional, array, max:8 items |
| `sensors.*.name` | required within array item, string, max:100 |
| `sensors.*.unit` | optional, nullable string, max:50 |
| contiguous check | API rejects payload where a lower slot is empty and a higher slot is filled |

### PUT /api/v1/node-types/{id}

Same fields as POST, all optional. Same validation rules apply to any field present.

- `area_id`: must still pass regex and uniqueness (excluding current record).
- `name`: must still be unique (excluding current record).
- `sensors`: **replace-all** — `sensors: []` clears all 8 slots. Omitting `sensors` entirely leaves all slots unchanged.

---

## Permission Keys for this Module

All CRUD endpoints are superadmin-only. No granular `node_type.*` keys needed for the initial release.

| Permission key | Status |
|----------------|--------|
| `node_type.view` | Reserved — superadmin only for now |
| `node_type.create` | Reserved |
| `node_type.update` | Reserved |
| `node_type.delete` | Reserved |

---

## Business Rules

1. **Superadmin only** for all CRUD endpoints. `/options` accessible to all authenticated users.
2. **Node type cannot be deleted** if referenced in `network_node_types`. API returns `409 Conflict: { message: "Node type is in use by one or more networks." }`. Frontend disables delete button with tooltip.
3. **`area_id` format:** Raw hex, no prefix, regex `/^[0-9A-Fa-f]{1,10}$/`. API normalises to uppercase on save. Max 10 characters.
4. **`name` must be globally unique** across all node types.
5. **Sensor slots are contiguous.** API rejects any payload where a lower slot is empty and a higher slot is filled.
6. **Cascade-clear on update.** If slot N is cleared (null name), the API sets all slots N through 8 to null regardless of what the payload says for those higher slots.
7. **`sensors` is replace-all on update.** Sending `sensors: []` clears all slots. Omitting `sensors` entirely leaves all flat columns unchanged.
8. **`sensor_N_unit` is independently nullable.** A slot is valid with just a name and no unit.
9. **Node types are global.** No company scoping — all authenticated users can read `/options`; only superadmin can mutate.

---

## Frontend UI Notes

### Node Types List Page

- Route: `/node-types` (lazy loaded, `is_superadmin` guard)
- Layout: `DashboardLayout`
- Table columns: Name, Area ID (monospace badge), Sensors (`3 sensors` summary), Description, Actions
- Filters: Search (name / area_id / description)
- Create opens `NodeTypeFormDialog` (shadcn `Dialog`)
- Edit opens `NodeTypeFormDialog` pre-filled
- Delete button disabled + tooltip when node type is in use by any network

### NodeTypeFormDialog

**Basic Info section:**
- Name (text input)
- Area ID (text input — manual entry only, no Generate button)
  - Validates regex `/^[0-9A-Fa-f]{1,10}$/` on blur
  - Placeholder: e.g. `A1B2C3`
- Description (textarea)

**Sensors section — dynamic slot list:**
- Starts with **1 blank sensor row** on create; all defined slots pre-filled on edit
- Each row: read-only slot number label + Name input + Unit input (nullable, placeholder `e.g. °C — leave blank if none`)
- **"Add Sensor" button** appends a new blank row; disabled when 8 slots are filled; shows count label `Add Sensor (N/8)`
- **× remove button** on each row: removes that row AND all rows below (cascade-clear). Tooltip: `"Removing this sensor will also remove all sensors below it."`
- Slot numbers are derived from array position — the user never manually enters a slot number

### Network module — multi-select update

The node types multi-select in `NetworkFormDialog` must be updated:
- **Remove** the static `NODE_TYPE_OPTIONS` constant from the select source
- **Add** a `useNodeTypeOptions()` hook call that fetches from `GET /api/v1/node-types/options`
- Display options as `name` with `area_id` as a secondary label or badge

### Scoping & Visibility

- Entire CRUD module hidden from non-superadmin — sidebar link rendered only when `user.is_superadmin = true`
- `/options` is called by any page that needs node type selection (not superadmin-gated in the hook)

---

## TypeScript Types (`src/types/nodeType.ts`)

```ts
// src/types/nodeType.ts

export interface NodeTypeSensor {
  slot: number;
  name: string;
  unit: string | null;
}

export interface NodeType {
  id: number;
  name: string;
  area_id: string;
  description: string | null;
  sensors: NodeTypeSensor[];
  sensor_count: number;
  created_at: string;
  updated_at: string;
}

export interface NodeTypeListResponse {
  data: NodeType[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    next: string | null;
    prev: string | null;
    last: string;
  };
}

export interface NodeTypeOption {
  id: number;
  name: string;
  area_id: string;
}

export interface SensorSlotPayload {
  name: string;
  unit?: string | null;
}

export interface StoreNodeTypePayload {
  name: string;
  area_id: string;
  description?: string | null;
  sensors?: SensorSlotPayload[];
}

export type UpdateNodeTypePayload = Partial<StoreNodeTypePayload>;
```

---

## API File (`src/api/nodeTypes.ts`)

```ts
// src/api/nodeTypes.ts
// API functions for Node Type module endpoints

import axiosClient from './axiosClient';
import type {
  NodeType,
  NodeTypeListResponse,
  NodeTypeOption,
  StoreNodeTypePayload,
  UpdateNodeTypePayload,
} from '@/types/nodeType';

export const getNodeTypes = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<NodeTypeListResponse> => {
  const res = await axiosClient.get('/node-types', { params });
  return res.data;
};

export const getNodeTypeOptions = async (): Promise<{ data: NodeTypeOption[] }> => {
  const res = await axiosClient.get('/node-types/options');
  return res.data;
};

export const getNodeType = async (id: number): Promise<{ data: NodeType }> => {
  const res = await axiosClient.get(`/node-types/${id}`);
  return res.data;
};

export const createNodeType = async (
  payload: StoreNodeTypePayload
): Promise<{ data: NodeType }> => {
  const res = await axiosClient.post('/node-types', payload);
  return res.data;
};

export const updateNodeType = async (
  id: number,
  payload: UpdateNodeTypePayload
): Promise<{ data: NodeType }> => {
  const res = await axiosClient.put(`/node-types/${id}`, payload);
  return res.data;
};

export const deleteNodeType = async (id: number): Promise<void> => {
  await axiosClient.delete(`/node-types/${id}`);
};
```

---

## Checklist Before Implementation

### API
- [ ] Confirm existing `node_types` migration is correct — no changes needed
- [ ] New migration: replace `node_type_key` string column in `network_node_types` with `node_type_id` FK
- [ ] `NodeTypeResource` maps flat columns → `sensors` array (defined slots only, slot number, name, unit)
- [ ] `NodeTypeResource` includes `sensor_count` convenience field
- [ ] `NodeTypeResource` **never** exposes raw `sensor_N_name` / `sensor_N_unit` flat columns
- [ ] `StoreNodeTypeAction` maps `sensors[]` array to flat columns (`sensors[0]` → slot 1, etc.); remaining slots set to `null`
- [ ] `UpdateNodeTypeAction` implements cascade-clear: clearing slot N also clears N+1…8
- [ ] `sensors` replace-all on update — omitted `sensors` field = flat columns untouched
- [ ] Contiguous slot validation: reject payload where slot N is empty and slot N+1 is filled
- [ ] `area_id` normalised to uppercase on save (mutator or in action)
- [ ] `StoreNodeTypeRequest` and `UpdateNodeTypeRequest` `authorize()` checks `is_superadmin` only
- [ ] `/options` endpoint uses `auth:sanctum` middleware only — **NOT** superadmin-gated
- [ ] `destroy` — check `network_node_types` FK before delete; return `409` if in use
- [ ] Routes registered for all 6 endpoints in `routes/api.php`
- [ ] Update `NetworkResource`: `node_types` returns `[{ id, name, area_id }]` objects
- [ ] Update `Network` model relationship to use `node_type_id` FK on pivot
- [ ] Feature tests: happy path CRUD, sensor slot mapping (1 sensor → slot 1, 8 sensors → all slots), cascade-clear on update, contiguous slot validation, 403 on CRUD for non-superadmin, 200 on `/options` for non-superadmin, 409 on delete in-use, unique `name` / `area_id` validation

### Frontend
- [ ] New types file `src/types/nodeType.ts`
- [ ] API file `src/api/nodeTypes.ts`
- [ ] Custom hook `src/hooks/useNodeTypes.ts`
- [ ] Page at `src/pages/node-types/NodeTypesPage.tsx`
- [ ] `NodeTypeFormDialog` component in `src/components/shared/`
- [ ] Route added to `src/routes/AppRouter.tsx` (lazy loaded)
- [ ] Sidebar link rendered only when `user.is_superadmin = true`
- [ ] Sensor slot UI: starts with 1 blank row on create; "Add Sensor" button disabled at 8 slots; shows count `(N/8)`
- [ ] × remove button triggers cascade-clear of current and all lower rows, with warning tooltip
- [ ] Area ID validates regex `/^[0-9A-Fa-f]{1,10}$/` on blur; placeholder shows `e.g. A1B2C3`
- [ ] Delete button disabled + tooltip when node type is in use
- [ ] **Network module updates:**
  - [ ] Remove `NodeTypeKey`, `NODE_TYPE_LABELS`, `NODE_TYPE_OPTIONS` from `src/constants/nodeTypes.ts`
  - [ ] Update `src/types/network.ts`: add `NetworkNodeType` interface; change `node_types` field to `NetworkNodeType[]`; change payload `node_types` to `number[]`
  - [ ] Update `NetworkFormDialog` node types multi-select: replace static constant with `getNodeTypeOptions()` call
  - [ ] Update `src/api/networks.ts`: `node_types` payload type changed to `number[]`
- [ ] All user-facing strings in `src/constants/strings.ts`
- [ ] Dark mode variants present on all custom styles

---

## Open Questions

- [ ] Should `area_id` become immutable once IoT nodes of this type are active? The hardware `area_id` is fixed at mesh level — changing it would break device communication. Recommend: immutable once any node of this type is deployed. Add to Business Rules when the Nodes module is spec'd.
- [ ] Is `name` editable after deployment? It has no hardware dependency unlike `area_id`, so it appears safe to change. Confirm.
- [ ] Should there be an `is_active` flag to retire a node type without deleting it? Not in the current migration — raise if needed.