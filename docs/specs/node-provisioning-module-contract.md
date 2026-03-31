# Node Provisioning Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Node Provisioning module allows superadmin users to register IoT nodes into a network and into the system. Provisioning is done in batches (transactions) of up to 10 nodes at a time. Each batch is tracked in `provisioning_batches`; each node within a batch is tracked in `provisioning_batch_nodes`. Once a node is successfully provisioned (confirmed by the backend IoT service via MQTT), a record is created in the `nodes` table with status `new`.

This module is **superadmin-only**.

---

## Node Status Lifecycle

| Status | Meaning |
|--------|---------|
| `new` | Node registered to network and system. Not yet configured or available for use. |
| `active` | Node fully configured and available for use. |
| `decommissioned` | Node removed from the network. Hidden from standard node listings. |

---

## Data Model

### `provisioning_batches`
Represents one provisioning transaction (up to 10 nodes).

```
provisioning_batches
├── id                    bigint, PK
├── network_id            FK → networks, restrictOnDelete
├── submitted_by          FK → users, nullOnDelete
├── status                string — pending | partial | complete | failed
├── total_nodes           unsignedTinyInt — count of nodes in this batch (1–10)
├── provisioned_nodes     unsignedTinyInt default 0 — count successfully provisioned
├── packet_id             string(8) — 2-byte hex e.g. "ffff", "ab12", auto-generated per batch
├── target_node_id        string — gateway address to target; "ffffffff" = broadcast to all gateways
├── is_auto_register      boolean default false — toggled by user on batch creation
├── command_sent          text — placeholder command string on creation; real logic added later
└── timestamps
```

**Two-batch auto-create flow:**
When a user creates a provisioning batch with a specific `target_node_id` (e.g. a real gateway address), the system automatically creates a second batch with `target_node_id = "ffffffff"` (broadcast). The broadcast batch gets:
- Its own unique `packet_id` (generated independently)
- The same nodes list copied from the original batch (new `provisioning_batch_nodes` rows)
- Same `network_id`, `submitted_by`, `is_auto_register`, and `command_sent` placeholder
- Its own independent `status` starting at `pending`

### `provisioning_batch_nodes`
Represents one node entry within a batch.

```
provisioning_batch_nodes
├── id                    bigint, PK
├── provisioning_batch_id FK → provisioning_batches, cascadeOnDelete
├── service_id            string — user-supplied service ID (serial/product key)
├── node_address          string(10) — user-supplied node ID, stored UPPERCASE
├── status                string — pending | provisioned | failed
├── last_command_id       ULID, nullable — FK → commands.id (nullOnDelete)
│                         updated on every send/resend
└── timestamps
```

### `nodes` table (existing — relevant columns for this feature)
- `node_config_id` — **nullable** for provisioning. Config is set in a later feature.
- `status` — `new` on creation from provisioning. Enum: `new | active | decommissioned`.
- `node_address` — stored UPPERCASE.
- `service_id` — unique across all nodes.

---

## Batch Status Rules

| Condition | Batch status |
|-----------|-------------|
| All nodes `pending` | `pending` |
| Some nodes `provisioned`, some `pending` or `failed` | `partial` |
| All nodes `provisioned` | `complete` |
| All nodes `failed` | `failed` |

Batch status is **recomputed** on every node status change.

---

## Auth Mechanism

Cookie-based Sanctum (ADR-001). All endpoints require `is_superadmin = true`. Non-superadmin receives `403`.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/v1/provisioning | sanctum + superadmin | List provisioning batches (paginated) |
| GET | /api/v1/provisioning/{batch} | sanctum + superadmin | Single batch with its nodes |
| POST | /api/v1/provisioning | sanctum + superadmin | Create a new provisioning batch |
| POST | /api/v1/provisioning/{batch}/nodes/{node}/resend | sanctum + superadmin | Resend provisioning command for a single node |

**Route note:** Register all named routes before `apiResource` to avoid collision.

---

## GET /api/v1/provisioning — Paginated Batch List

Accepts `?page`, `?per_page` (1–100, default 15), `?network_id`, `?status`.

### Response shape (ProvisioningBatchResource — list)

```json
{
  "data": [
    {
      "id": 1,
      "network": { "id": 1, "name": "Building A", "network_address": "0xA1B2C3" },
      "submitted_by": { "id": 1, "name": "Super Admin" },
      "status": "partial",
      "total_nodes": 5,
      "provisioned_nodes": 3,
      "status_summary": "3/5 provisioned",
      "created_at": "2026-03-31T10:00:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

---

## GET /api/v1/provisioning/{batch} — Single Batch with Nodes

```json
{
  "data": {
    "id": 1,
    "network": { "id": 1, "name": "Building A", "network_address": "0xA1B2C3" },
    "submitted_by": { "id": 1, "name": "Super Admin" },
    "status": "partial",
    "total_nodes": 5,
    "provisioned_nodes": 3,
    "status_summary": "3/5 provisioned",
    "nodes": [
      {
        "id": 1,
        "service_id": "SVC-001",
        "node_address": "A3F2B1",
        "status": "provisioned",
        "last_command_id": "01HV...",
        "created_at": "2026-03-31T10:00:00+00:00"
      },
      {
        "id": 2,
        "service_id": "SVC-002",
        "node_address": "B4C3D2",
        "status": "failed",
        "last_command_id": "01HV...",
        "created_at": "2026-03-31T10:00:00+00:00"
      }
    ],
    "created_at": "2026-03-31T10:00:00+00:00"
  }
}
```

---

## POST /api/v1/provisioning — Create Batch

### Request

```json
{
  "network_id": 1,
  "target_node_id": "A3F2B1",
  "is_auto_register": false,
  "nodes": [
    { "service_id": "SVC-001", "node_address": "a3f2b1" },
    { "service_id": "SVC-002", "node_address": "b4c3d2" }
  ]
}
```

### Validation rules

| Field | Rule |
|-------|------|
| `network_id` | required, integer, exists:networks,id |
| `target_node_id` | required, string, max:10 |
| `is_auto_register` | optional, boolean, default false |
| `nodes` | required, array, min:1, max:10 |
| `nodes.*.service_id` | required, string, max:255, unique:nodes,service_id — also unique within the batch |
| `nodes.*.node_address` | required, string, max:10 — stored uppercase |

### Packet ID generation

```php
// app/Actions/Provisioning/GeneratePacketIdAction.php
// Generates a unique 2-byte hex string e.g. "ab12"
// Retries up to 10 times on collision against provisioning_batches.packet_id
$packetId = strtolower(bin2hex(random_bytes(2)));
```

### What the action does

1. Generates a unique `packet_id` for the primary batch.
2. Creates the primary `provisioning_batches` record:
   - `status: pending`, `total_nodes: count`, `packet_id`, `target_node_id`, `is_auto_register`
   - `command_sent`: placeholder string `"PROVISIONING_CMD:{packet_id}"` (real logic added later)
3. For each node: normalises `node_address` to uppercase, creates `provisioning_batch_nodes` (`status: pending`).
4. For each node: creates a `commands` record (`type: node_provisioning`, `status: pending`, `payload: { service_id, node_address, network_id, packet_id, target_node_id }`, `correlation_id: Str::uuid()`), sets `last_command_id` on the batch node.
5. Auto-creates a second broadcast batch (`target_node_id: "ffffffff"`):
   - Generates its own unique `packet_id`
   - Copies same `network_id`, `submitted_by`, `is_auto_register`
   - `command_sent`: `"PROVISIONING_CMD:{new_packet_id}"`
   - Copies all nodes from the primary batch (new `provisioning_batch_nodes` rows, status: pending)
   - Creates its own `commands` records for each copied node
6. Everything wrapped in a single DB transaction.
7. Returns **both** batches (primary + broadcast).

### Response

`201 Created` with both batches:

```json
{
  "data": {
    "primary": { ...ProvisioningBatchResource with nodes... },
    "broadcast": { ...ProvisioningBatchResource with nodes... }
  }
}
```

---

## POST /api/v1/provisioning/{batch}/nodes/{node}/resend

Resends the provisioning command for a single node. Only valid when node `status` is `failed` or `pending`.

### What the action does

1. Validates that `$node->provisioning_batch_id === $batch->id` (ownership check).
2. Validates node status is `failed` or `pending` — returns `422` if `provisioned`.
3. Creates a new `commands` record (`type: node_provisioning`, same payload shape).
4. Updates `provisioning_batch_nodes.last_command_id` to the new command ID.
5. Resets node status to `pending`.
6. Recomputes batch status.
7. Wrapped in a DB transaction.

### Response

`200 OK` with updated `ProvisioningBatchNodeResource`:

```json
{
  "data": {
    "id": 2,
    "service_id": "SVC-002",
    "node_address": "B4C3D2",
    "status": "pending",
    "last_command_id": "01HV...",
    "created_at": "2026-03-31T10:00:00+00:00"
  }
}
```

---

## Business Rules

1. **Superadmin only.** All endpoints return `403` for non-superadmin.
2. **Max 10 nodes per batch.** API returns `422` if `nodes` array exceeds 10.
3. **`service_id` must be globally unique** across the `nodes` table AND unique within the batch payload.
4. **`node_address` is stored uppercase.** Action normalises before saving.
5. **`node_config_id` is nullable** on `nodes` — provisioning does not set it. It is set in a later feature.
6. **Resend is only valid** when node status is `pending` or `failed`. Returns `422` if already `provisioned`.
7. **Batch status is recomputed** after every node status change (resend resets to `pending`, which may change batch from `failed` → `partial`).
8. **`status_summary`** is a computed field: `"{provisioned_nodes}/{total_nodes} provisioned"`.
9. **Each provisioning action (create + resend) writes a `commands` record** with `type: node_provisioning`. This is the audit trail and future MQTT dispatch hook.
10. **Nodes created in the `nodes` table** only when the IoT backend service confirms success (not by this API directly). The API manages the batch/command records only.

---

## Permission Keys

All endpoints are superadmin-only. No granular permission keys needed for this module.

| Key | Reserved for |
|-----|-------------|
| `provisioning.view` | Future — if company admins get read access |
| `provisioning.create` | Future — if company admins can provision |

---

## TypeScript Types (`src/types/provisioning.ts`)

```ts
export type ProvisioningBatchStatus = 'pending' | 'partial' | 'complete' | 'failed';
export type ProvisioningNodeStatus  = 'pending' | 'provisioned' | 'failed';

export interface ProvisioningBatchNode {
  id: number;
  service_id: string;
  node_address: string;
  status: ProvisioningNodeStatus;
  last_command_id: string | null;
  created_at: string;
}

export interface ProvisioningBatch {
  id: number;
  network: { id: number; name: string; network_address: string };
  submitted_by: { id: number; name: string } | null;
  status: ProvisioningBatchStatus;
  total_nodes: number;
  provisioned_nodes: number;
  status_summary: string;
  packet_id: string;
  target_node_id: string;
  is_auto_register: boolean;
  command_sent: string;
  nodes?: ProvisioningBatchNode[];
  created_at: string;
}

export interface ProvisioningBatchListResponse {
  data: ProvisioningBatch[];
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

export interface CreateProvisioningBatchPayload {
  network_id: number;
  target_node_id: string;
  is_auto_register?: boolean;
  nodes: { service_id: string; node_address: string }[];
}

export interface CreateProvisioningBatchResponse {
  data: {
    primary: ProvisioningBatch;
    broadcast: ProvisioningBatch;
  };
}
```

---

## API File (`src/api/provisioning.ts`)

```ts
import axiosClient from './axiosClient';
import type {
  ProvisioningBatch,
  ProvisioningBatchListResponse,
  ProvisioningBatchNode,
  CreateProvisioningBatchPayload,
} from '@/types/provisioning';

export const getProvisioningBatches = async (params?: {
  page?: number;
  per_page?: number;
  network_id?: number;
  status?: string;
}): Promise<ProvisioningBatchListResponse> => {
  const res = await axiosClient.get('/v1/provisioning', { params });
  return res.data;
};

export const getProvisioningBatch = async (
  id: number
): Promise<{ data: ProvisioningBatch }> => {
  const res = await axiosClient.get(`/v1/provisioning/${id}`);
  return res.data;
};

export const createProvisioningBatch = async (
  payload: CreateProvisioningBatchPayload
): Promise<{ data: ProvisioningBatch }> => {
  const res = await axiosClient.post('/v1/provisioning', payload);
  return res.data;
};

export const resendProvisioningNode = async (
  batchId: number,
  nodeId: number
): Promise<{ data: ProvisioningBatchNode }> => {
  const res = await axiosClient.post(
    `/v1/provisioning/${batchId}/nodes/${nodeId}/resend`
  );
  return res.data;
};
```

---

## Frontend Pages

### ProvisioningPage (`/provisioning`)
- Superadmin guard
- Network filter dropdown (uses `GET /api/v1/networks/options`)
- Status filter (All / Pending / Partial / Complete / Failed)
- Refresh button — refetches the batch list
- `DataTableServer` with columns: Network | Submitted By | Date | Total | Status Summary | Batch Status badge | Actions
- Each row is expandable **or** has a "View" button → navigates to `/provisioning/{id}`
- "New Provisioning" button → navigates to `/provisioning/new?network_id={id}` (passes selected network)

### NewProvisioningPage (`/provisioning/new`)
- Reads `?network_id` from query string — pre-selects the network (read-only display, not editable)
- Dynamic node list — starts with 1 row, "Add Node" button appends rows (max 10)
- Each row: Service ID (text input) + Node Address (text input, max 10 chars, uppercase on blur) + remove button
- "Add Node" button disabled when 10 rows present — shows "(10/10 max)" label
- Submit button — disabled + spinner while submitting
- On success: toast.success, redirect to `/provisioning/{newBatchId}`
- On failure: toast.error, keep form intact

### ProvisioningDetailPage (`/provisioning/:id`)
- Shows batch header: network, submitted by, date, status badge, status summary
- Refresh button
- Node list table (not paginated — max 10 rows): Service ID | Node Address | Status badge | Resend button
- Resend button: visible only when node status is `pending` or `failed`; disabled + spinner while resending
- On resend success: updates node row status inline (or refetches)

---

## Checklist Before Implementation

### API
- [x] Migration: `provisioning_batches` table
- [x] Migration: `provisioning_batch_nodes` table
- [x] `ProvisioningBatch` model + relationships (`network`, `submittedBy`, `nodes`)
- [x] `ProvisioningBatchNode` model + relationships (`batch`, `lastCommand`)
- [x] `NodeStatus` PHP enum (`new`, `active`, `decommissioned`)
- [x] `ProvisioningBatchStatus` PHP enum (`pending`, `partial`, `complete`, `failed`)
- [x] `ProvisioningNodeStatus` PHP enum (`pending`, `provisioned`, `failed`)
- [x] `ProvisioningBatchResource` — list shape (no nodes)
- [x] `ProvisioningBatchResource` — detail shape (with nodes)
- [x] `ProvisioningBatchNodeResource`
- [x] `StoreProvisioningBatchDTO` + `StoreProvisioningBatchAction`
- [x] `ResendProvisioningNodeAction`
- [x] `RecomputeBatchStatusAction` (called after any node status change)
- [x] `ProvisioningController` (index, show, store)
- [x] `ResendProvisioningNodeController` (single-action)
- [x] `StoreProvisioningBatchRequest` — validation + superadmin authorize
- [x] Routes registered in `routes/api.php`
- [x] Feature tests: happy path create, max 10 validation, duplicate service_id, resend happy path, resend on provisioned node (422), 403 for non-superadmin

### Frontend
- [x] `src/types/provisioning.ts`
- [x] `src/api/provisioning.ts`
- [x] `src/hooks/useProvisioning.ts`
- [x] `src/pages/provisioning/ProvisioningPage.tsx`
- [x] `src/pages/provisioning/NewProvisioningPage.tsx`
- [x] `src/pages/provisioning/ProvisioningDetailPage.tsx`
- [x] Routes in `AppRouter.tsx` (lazy loaded, superadmin guard)
- [x] Sidebar link (superadmin only)
- [x] All strings in `src/constants/strings.ts`
- [x] Dark mode variants on all custom styles
