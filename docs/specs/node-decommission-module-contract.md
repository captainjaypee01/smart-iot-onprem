# Node Decommission Module — Shared Contract

Both API and frontend must treat this as immutable. Update this doc when the contract changes.

---

## Overview

The Node Decommission module allows authorised users to remove IoT nodes from a network by sending a decommission command and confirming its success via a follow-up verification command. A node is decommissioned by updating its `status` column in the `nodes` table to `decommissioned` in-place — no soft delete is performed, because decommissioned nodes may be reprovisioned at a later date.

All decommission attempts are recorded in the dedicated `node_decommission_logs` table (separate from the `commands` table, which is reserved for `send_data` and gateway dispatch flows). This table serves as the full audit trail: it tracks every decommission command sent, every verification command sent, and the current status of each attempt. Internal ACKs from the IoT service update log records directly via a dedicated `NodeDecommissionController`.

The module is accessible to users who hold explicit `node_decommission.*` permission keys. Superadmins bypass all permission checks (standard project rule). The page is a standalone route not nested under `/nodes`. A "pick network" step precedes the node list, ensuring all downstream data is network-scoped.

Every decommission and verification command creates a `Command` record (and a matching `OutboxEvent`) atomically in the same DB transaction as the log entry. The outbox → Redis Streams → MQTT dispatch pipeline picks these up automatically. `command_id` and `verification_command_id` on the log row link back to the respective `commands` rows for visibility in the Commands Console.

---

## Actors & Permissions

| Permission key | Who holds it | What it gates |
|----------------|-------------|---------------|
| `node_decommission.view` | Any role with the key | View the node decommission page, list nodes, view decommission history (`GET` endpoints) |
| `node_decommission.decommission` | Any role with the key | Send a decommission command for a node (`POST /api/v1/node-decommission/{node}/decommission`) |
| `node_decommission.verify` | Any role with the key | Send a verification command (`POST /api/v1/node-decommission/{node}/verify`) and resend a decommission command (`POST /api/v1/node-decommission/{node}/resend`) |
| `node_decommission.manual_decommission` | Any role with the key | Mark a node as manually decommissioned without sending a command (`POST /api/v1/node-decommission/{node}/manual`) |

All four keys are seeded under `module = 'node_decommission'` in `PermissionSeeder.php`.

**Superadmin bypass:** Superadmins bypass all `NodeDecommissionPolicy` checks automatically via Laravel's before-hook. No explicit `is_superadmin` check is needed inside the policy.

---

## Data Model

### `nodes` table — added column (modify existing migration)

The existing migration (`0001_01_01_000014_create_nodes_table.php`) must be updated to add a `status` column. The database can be migrated fresh.

```
nodes (existing table — one column added)
└── status    string, NOT NULL, default 'new'
              Enum values: 'new' | 'active' | 'decommissioned'
              Added after the existing status-related columns
              (is_online, last_online_at, provisioned_at).
```

**Index:** Add `(status)` index for filtering nodes by status.

**Node status values:**

| Value | Meaning |
|-------|---------|
| `new` | Node registered to network; not yet configured. Set by Node Provisioning. |
| `active` | Node fully configured and operational. |
| `decommissioned` | Node removed from the network. Hidden from standard node listings but not deleted (may be reprovisioned). |

**No soft delete on `nodes`.** The `status` column is the mechanism for decommissioned state. The row is never deleted.

---

### `node_decommission_logs` table (new table)

Records every decommission attempt for a node — both the initial decommission command send and any subsequent verification command sends.

```
node_decommission_logs
├── id                      bigint unsigned, PK (auto-increment)
├── node_id                 bigint unsigned, NOT NULL
│                           FK → nodes.id, ON DELETE RESTRICT
│                           (cannot delete a node if decommission log entries exist)
├── network_id              bigint unsigned, NOT NULL
│                           FK → networks.id, ON DELETE RESTRICT
│                           Denormalised for efficient network-scoped queries.
├── initiated_by            bigint unsigned, nullable
│                           FK → users.id, ON DELETE SET NULL
│                           The user who triggered this decommission attempt.
│                           NULL if user is later deleted.
├── status                  string, NOT NULL, default 'pending'
│                           Enum values:
│                           'pending'        — decommission command sent, awaiting ACK / verification
│                           'completed'      — node confirmed decommissioned via IoT ACK; node.status = 'decommissioned'
│                           'failed'         — automated path failed: either node replied alive to verify (→ Resend)
│                           │                  or this pending log was superseded by a manual decommission
│                           'manual'         — node was manually marked decommissioned (no IoT command sent)
├── command_id              bigint unsigned, nullable
│                           FK-equivalent (no FK constraint) → commands.id for the decommission command.
│                           NULL when is_manual = true.
├── verification_command_id bigint unsigned, nullable
│                           FK-equivalent (no FK constraint) → commands.id for the verification command.
│                           NULL until verify is sent.
├── packet_id               string(4), nullable
│                           Sequential 4-char hex tracking ID, e.g. "0001", "0002".
│                           Generated by incrementing the global max across both packet_id
│                           and verification_packet_id columns. Starts at "0001".
│                           NULL when is_manual = true.
├── payload                 string, nullable
│                           The hex payload sent in the decommission command,
│                           e.g. "0501ff". Stored for reference in verification command
│                           construction. NULL when is_manual = true.
├── is_manual               boolean, NOT NULL, default false
│                           true when this log entry was created via the manual
│                           decommission action (no command was sent to IoT).
├── verification_packet_id  string(4), nullable
│                           Sequential 4-char hex tracking ID for the verification command.
│                           Uses the same global counter as packet_id (next ID after current max).
│                           NULL until first verify is sent.
├── verification_sent_at    timestamp, nullable
│                           Timestamp when the most recent verification command was sent.
├── verification_expires_at timestamp, nullable
│                           Set to verification_sent_at + 2 minutes.
│                           When NOW() > verification_expires_at and status is still 'pending',
│                           the API reports the verification as timed out on read.
│                           NULL until first verify is sent.
├── error_message           text, nullable
│                           Human-readable failure reason. Set by internal ACK endpoint
│                           or manual fail action.
├── decommissioned_at       timestamp, nullable
│                           Set when status transitions to 'completed' or 'manual'.
│                           This is the authoritative decommission timestamp.
└── timestamps              (created_at, updated_at)
```

**Indexes:**

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| Primary key | `id` | B-tree | — |
| Index | `node_id` | B-tree | Lookup logs by node |
| Index | `network_id` | B-tree | Network-scoped history queries |
| Index | `initiated_by` | B-tree | User audit queries |
| Index | `status` | B-tree | Filter by status |
| Index | `created_at` | B-tree | Default sort |

**Foreign keys:**

| Column | References | On Delete |
|--------|-----------|-----------|
| `node_id` | `nodes.id` | RESTRICT |
| `network_id` | `networks.id` | RESTRICT |
| `initiated_by` | `users.id` | SET NULL |

**No soft delete on `node_decommission_logs`.** Log entries are permanent records.

---

### Relationships to Existing Models

- `NodeDecommissionLog` belongs to `Node` (via `node_id`).
- `NodeDecommissionLog` belongs to `Network` (via `network_id`).
- `NodeDecommissionLog` belongs to `User` (via `initiated_by`, nullable).
- `Node` has many `NodeDecommissionLog` (via `node_id`).

---

### Eloquent Model Notes (`NodeDecommissionLog`)

- **Casts:** `is_manual` → `boolean`, `verification_sent_at` → `datetime`, `verification_expires_at` → `datetime`, `decommissioned_at` → `datetime`.
- **No soft deletes.** Log entries are permanent.
- **Scopes:**
  - `scopeForNetwork($networkId)` — `WHERE network_id = $networkId`.
  - `scopeForNode($nodeId)` — `WHERE node_id = $nodeId`.
- **Computed attribute `verification_timed_out`:** Returns `true` when `verification_expires_at IS NOT NULL AND NOW() > verification_expires_at AND status = 'pending'`. This is appended to the resource — not stored in the DB.

---

### Packet ID Generation

IDs are **sequential**, zero-padded 4-char hex strings. A single shared counter covers both decommission and verification IDs to guarantee global uniqueness.

```
Algorithm (GenerateDecommissionPacketIdAction::next()):
  1. SELECT MAX(packet_id) FROM node_decommission_logs              → maxDecommission
  2. SELECT MAX(verification_packet_id) FROM node_decommission_logs → maxVerification
  3. current = max(hexdec(maxDecommission), hexdec(maxVerification)) — 0 if both NULL
  4. next    = current + 1   (throws RuntimeException if next > 0xFFFF)
  5. return  str_pad(dechex(next), 4, '0', STR_PAD_LEFT)  →  e.g. "0001", "000f", "0100"

Action: app/Actions/NodeDecommission/GenerateDecommissionPacketIdAction.php (method: next())
```

Fixed-length zero-padded hex strings sort the same as numeric order, so `MAX()` on the string column gives the numerically largest value.

**Decommission command:** `source_ep = 155`, `dest_ep = 146`, `payload = "0e05446f697421"`
**Verification command:** `source_ep = 5`, `dest_ep = 5`, `payload = "0501ff"`

Both commands use `type = "send_data"` and always have a `request_id = random_int(100_000_000, 4_294_967_295)`.

---

## Decommission Log Status State Machine

```
(none) ──[POST decommission]──► pending
                                   │
                         ┌─────────┤
                         │         │
               [POST verify]   [internal ACK = error]
                         │         │
                         ▼         ▼
                      pending    failed ──[POST resend]──► pending
                     (reset timer)  │
                         │          └── (node.status = 'decommissioned'?) → no Resend button shown
               [internal ACK = success]
                         │
                         ▼
                      completed   (node.status → 'decommissioned')

(none) ──[POST manual]──► manual   (node.status → 'decommissioned')
         (any pending log for same node → set to 'failed')
```

**State transition rules:**

| From | Event | To | Side effect |
|------|-------|----|-------------|
| — | Decommission command sent | `pending` | `command_id`, `packet_id`, `payload` set |
| `pending` | Verify command sent | `pending` | `verification_command_id`, `verification_packet_id`, `verification_sent_at`, `verification_expires_at` reset |
| `pending` | Internal ACK success (verify) | `completed` | `decommissioned_at = NOW()`, `node.status = 'decommissioned'` |
| `pending` | Internal ACK error (decommission or verify) | `failed` | `error_message` set |
| `failed` | Resend decommission (node NOT decommissioned) | `pending` | new `packet_id` + `command_id` set, `error_message` cleared |
| `pending` | Manual decommission triggered | `failed` | Superseded by manual action; `error_message` set |
| — | Manual decommission | `manual` | `is_manual = true`, `decommissioned_at = NOW()`, `node.status = 'decommissioned'` |

Transitions must be idempotent. If the internal ACK endpoint is called with a success signal for an entry already at `completed`, return `200` without mutation (no-op). If called for an entry at `manual`, return `409 Conflict`.

---

## API Endpoints

All public endpoints use Sanctum cookie session auth. The internal endpoint uses `X-Internal-Token`.

### Endpoint Summary

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/api/v1/node-decommission/nodes` | Sanctum | `node_decommission.view` | List decommissionable nodes for a network |
| GET | `/api/v1/node-decommission/history` | Sanctum | `node_decommission.view` | Paginated decommission history for a network |
| POST | `/api/v1/node-decommission/{node}/decommission` | Sanctum | `node_decommission.decommission` | Send decommission command |
| POST | `/api/v1/node-decommission/{node}/resend` | Sanctum | `node_decommission.verify` | Resend decommission command |
| POST | `/api/v1/node-decommission/{node}/verify` | Sanctum | `node_decommission.verify` | Send verification command |
| POST | `/api/v1/node-decommission/{node}/manual` | Sanctum | `node_decommission.manual_decommission` | Manually mark as decommissioned |
| PATCH | `/api/v1/internal/node-decommission/{log}/status` | `X-Internal-Token` | — (internal only) | Update decommission log status from IoT service |

**Route note:** Register the specific named routes (`/nodes`, `/history`) before the `{node}` wildcard routes to avoid collision. All routes are handled by `NodeDecommissionController`.

---

### GET /api/v1/node-decommission/nodes

Returns the list of nodes in a network that are eligible for decommissioning (status is NOT `decommissioned`).

**Auth:** Sanctum cookie session + `node_decommission.view` permission.

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `network_id` | integer | Required | Network to list nodes for |
| `search` | string | Optional | Filter by node `name`, `service_id` (partial match, case-insensitive) |
| `node_type_id` | integer | Optional | Filter by node type (joins `network_node_types`) |
| `page` | integer | Optional | Page number (default: 1) |
| `per_page` | integer | Optional | Items per page, 1–100 (default: 15) |

**Scoping rules:**
- Non-superadmin: `network_id` must be in the user's `role_networks`. Returns `403` if the user does not have access to the requested network.
- Superadmin: any `network_id` is permitted.
- Always excludes nodes with `status = 'decommissioned'`.

**Default sort:** `name ASC`.

**Success response:** `200 OK`

```json
{
  "data": [
    {
      "id": 42,
      "name": "Node Floor 3",
      "node_address": "A3F2B1",
      "service_id": "SVC-001",
      "status": "active",
      "network": { "id": 1, "name": "Building A", "network_address": "A1B2C3" },
      "latest_decommission_log": null
    },
    {
      "id": 43,
      "name": "Node Floor 4",
      "node_address": "B4C3D2",
      "service_id": "SVC-002",
      "status": "new",
      "network": { "id": 1, "name": "Building A", "network_address": "A1B2C3" },
      "latest_decommission_log": {
        "id": 7,
        "status": "failed",
        "is_manual": false,
        "verification_timed_out": false,
        "error_message": "Node did not respond",
        "created_at": "2026-04-08T10:00:00+00:00"
      }
    }
  ],
  "meta": { "current_page": 1, "last_page": 2, "per_page": 15, "total": 17 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

**`latest_decommission_log`** is the most recent `node_decommission_logs` entry for that node (ordered by `created_at DESC`). `null` if no prior attempt exists.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.view` permission |
| 403 | `network_id` not in user's accessible networks (non-superadmin) |
| 422 | `network_id` missing or not a valid integer |

**Resource class:** `DecommissionNodeResource`

---

### GET /api/v1/node-decommission/history

Returns paginated decommission log history for a selected network.

**Auth:** Sanctum cookie session + `node_decommission.view` permission.

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `network_id` | integer | Required | Network to list history for |
| `page` | integer | Optional | Page number (default: 1) |
| `per_page` | integer | Optional | Items per page, 1–100 (default: 15) |
| `status` | string | Optional | Filter by log status: `pending`, `completed`, `failed`, `manual` |

**Scoping rules:** Same as node list — non-superadmin must have `network_id` in their `role_networks`.

**Default sort:** `created_at DESC`.

**Success response:** `200 OK`

```json
{
  "data": [
    {
      "id": 7,
      "node": { "id": 43, "name": "Node Floor 4", "node_address": "B4C3D2", "service_id": "SVC-002", "status": "active" },
      "network": { "id": 1, "name": "Building A", "network_address": "A1B2C3" },
      "initiated_by": { "id": 5, "name": "Jane Doe" },
      "status": "failed",
      "is_manual": false,
      "command_id": 101,
      "verification_command_id": 102,
      "packet_id": "0003",
      "payload": "0e05446f697421",
      "verification_packet_id": "0004",
      "verification_sent_at": "2026-04-08T10:02:00+00:00",
      "verification_expires_at": "2026-04-08T10:04:00+00:00",
      "verification_timed_out": false,
      "error_message": "Node did not respond",
      "decommissioned_at": null,
      "created_at": "2026-04-08T10:00:00+00:00",
      "updated_at": "2026-04-08T10:03:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 41 },
  "links": { "first": "...", "next": "...", "prev": null, "last": "..." }
}
```

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.view` permission |
| 403 | `network_id` not in user's accessible networks (non-superadmin) |
| 422 | `network_id` missing or invalid |

**Resource class:** `NodeDecommissionLogResource`

---

### POST /api/v1/node-decommission/{node}/decommission

Send a decommission command for a node. Creates a new `node_decommission_logs` entry with `status = 'pending'`.

**Auth:** Sanctum cookie session + `node_decommission.decommission` permission.

**Route model binding:** `{node}` binds to `Node` by `id`.

**Request body:**

```json
{
  "network_id": 1
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `network_id` | required, integer, exists:networks,id, must be in user's accessible networks (or superadmin), must match `node.network_id` |

**Note:** The `payload` field is fixed server-side as `"0e05446f697421"`. It is not accepted from the client.

**Business rules:**

1. The node's `status` must NOT be `decommissioned`. Returns `422` if already decommissioned.
2. There must be no existing log entry for this node with `status = 'pending'`. Returns `409 Conflict` if an active pending decommission already exists.
3. `network_id` must match `node.network_id`. Returns `422` if mismatched.

**What the action does (`DecommissionNodeAction`):**

1. Validates node is not already decommissioned — `422` if so.
2. Validates no active `pending` log exists for this node — `409` if so.
3. Generates `packet_id` via `GenerateDecommissionPacketIdAction::next()` (sequential, shared counter across both `packet_id` and `verification_packet_id` columns).
4. Creates a `Command` record and `OutboxEvent` in the same transaction (`source_ep: 155`, `dest_ep: 146`, `type: send_data`).
5. Creates `node_decommission_logs` record:
   - `status: pending`, `is_manual: false`
   - `command_id` (from the created Command)
   - `packet_id`, `payload` fixed value `"0e05446f697421"` (normalised to lowercase)
   - `node_id`, `network_id`, `initiated_by: auth()->id()`
6. All wrapped in a single DB transaction.
7. Returns the created log entry.

**Success response:** `201 Created`

```json
{
  "data": {
    "id": 8,
    "node": { "id": 42, "name": "Node Floor 3", "node_address": "A3F2B1", "service_id": "SVC-001", "status": "active" },
    "network": { "id": 1, "name": "Building A", "network_address": "A1B2C3" },
    "initiated_by": { "id": 5, "name": "Jane Doe" },
    "status": "pending",
    "is_manual": false,
    "command_id": 101,
    "verification_command_id": null,
    "packet_id": "0001",
    "payload": "0e05446f697421",
    "verification_packet_id": null,
    "verification_sent_at": null,
    "verification_expires_at": null,
    "verification_timed_out": false,
    "error_message": null,
    "decommissioned_at": null,
    "created_at": "2026-04-08T10:00:00+00:00",
    "updated_at": "2026-04-08T10:00:00+00:00"
  }
}
```

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.decommission` permission |
| 403 | `network_id` not in user's accessible networks |
| 404 | Node not found |
| 409 | Active `pending` decommission log already exists for this node |
| 422 | Validation failure |
| 422 | Node is already `decommissioned` |
| 422 | `network_id` does not match `node.network_id` |

**Resource class:** `NodeDecommissionLogResource`

---

### POST /api/v1/node-decommission/{node}/resend

Resend a decommission command for a node whose most recent log entry has `status = 'failed'`. Creates a fresh `packet_id` and resets the log entry to `pending`.

**Auth:** Sanctum cookie session + `node_decommission.verify` permission.

**Route model binding:** `{node}` binds to `Node` by `id`.

**No request body required.** The action reuses the `payload` from the existing log entry.

**Business rules:**

1. The most recent `node_decommission_logs` entry for this node must exist and have `status = 'failed'`. Returns `422` if no failed log exists.
2. The node must not be `decommissioned`. Returns `422` if so.

**What the action does (`ResendDecommissionAction`):**

1. Finds the most recent `node_decommission_logs` entry for the node — `404` if none.
2. Validates `status = 'failed'` — `422` if not.
3. Validates node is not `decommissioned` — `422` if so.
4. Generates a new `packet_id` via `GenerateDecommissionPacketIdAction::next()`.
5. Creates a new `Command` record and `OutboxEvent` (`source_ep: 155`, `dest_ep: 146`, `type: send_data`).
6. Updates the log entry: `status: pending`, new `packet_id`, new `command_id`, clears `error_message`.
7. Wrapped in a DB transaction.
8. Returns the updated log entry.

**Success response:** `200 OK` — `NodeDecommissionLogResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.verify` permission |
| 404 | Node not found or no decommission log exists |
| 422 | Most recent log status is not `failed` |
| 422 | Node is already `decommissioned` |

---

### POST /api/v1/node-decommission/{node}/verify

Send a verification command for a node in `pending` decommission state. The verification payload is constructed as `{packet_id}0501ff` — the current log entry's `packet_id` concatenated with the fixed suffix `"0501ff"`. A fresh `verification_packet_id` is generated each time, and `verification_expires_at` is reset to `NOW() + 2 minutes`.

**Auth:** Sanctum cookie session + `node_decommission.verify` permission.

**Route model binding:** `{node}` binds to `Node` by `id`.

**No request body required.**

**Business rules:**

1. The most recent `node_decommission_logs` entry for this node must have `status = 'pending'`. Returns `422` if not pending.
2. The node must not be `decommissioned`. Returns `422` if so.
3. If a previous verification was sent and `verification_expires_at` is in the future (not yet timed out), the verify action may still be called — the timer is simply reset (no cooldown enforced at the API layer; the 5-second cooldown is a frontend-only constraint).

**What the action does (`VerifyDecommissionAction`):**

1. Finds the most recent `node_decommission_logs` entry for the node — `404` if none.
2. Validates `status = 'pending'` — `422` if not.
3. Validates node is not `decommissioned` — `422` if so.
4. Generates a fresh `verification_packet_id` via `GenerateDecommissionPacketIdAction::next()`.
5. Constructs the verification payload internally: `"0501ff"` (fixed value, `source_ep: 5`, `dest_ep: 5`). This is NOT stored in the `payload` column — the stored `payload` is the decommission payload only.
6. Creates a new `Command` record and `OutboxEvent` (`source_ep: 5`, `dest_ep: 5`, `type: send_data`).
7. Updates the log entry:
   - `verification_command_id`: new Command's id
   - `verification_packet_id`: new value
   - `verification_sent_at`: `NOW()`
   - `verification_expires_at`: `NOW() + 2 minutes`
8. Wrapped in a DB transaction.
9. Returns the updated log entry.

**Success response:** `200 OK` — `NodeDecommissionLogResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.verify` permission |
| 404 | Node not found or no decommission log exists |
| 422 | Most recent log status is not `pending` |
| 422 | Node is already `decommissioned` |

---

### POST /api/v1/node-decommission/{node}/manual

Manually mark a node as decommissioned without sending an IoT command. Creates a `node_decommission_logs` entry with `is_manual = true`, `status = 'manual'`, and immediately updates `node.status = 'decommissioned'`.

**Auth:** Sanctum cookie session + `node_decommission.manual_decommission` permission.

**Route model binding:** `{node}` binds to `Node` by `id`.

**No request body required.**

**Business rules:**

1. The node must not already be `decommissioned`. Returns `422` if so.
2. If an active `pending` log exists for this node, it is updated to `status = 'failed'` before the manual log is created. This marks the automated approach as superseded by the manual action. The "Resend" button will NOT appear for this failed log because `node.status` will already be `decommissioned`.

**What the action does (`ManualDecommissionAction`):**

1. Validates node is not already `decommissioned` — `422` if so.
2. Updates any existing `pending` logs for this node to `status = 'failed'` (they were superseded).
3. Creates `node_decommission_logs` record:
   - `status: manual`, `is_manual: true`
   - `decommissioned_at: NOW()`
   - `initiated_by: auth()->id()`
   - `packet_id: null`, `payload: null`, `command_id: null`
   - `node_id`, `network_id` from the node record
4. Updates `node.status = 'decommissioned'`.
5. All wrapped in a single DB transaction.
6. Returns the created log entry.

**Success response:** `201 Created` — `NodeDecommissionLogResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 403 | User lacks `node_decommission.manual_decommission` permission |
| 404 | Node not found |
| 422 | Node is already `decommissioned` |

---

### PATCH /api/v1/internal/node-decommission/{log}/status

**Internal endpoint.** Called by the IoT service after receiving an MQTT ack for a decommission or verification command. Requires `X-Internal-Token` header. Not accessible via Sanctum.

**Auth:** `X-Internal-Token` header validation only. No user session required.

**Route model binding:** `{log}` binds to `NodeDecommissionLog` by `id`.

**Request body:**

```json
{
  "result": "success",
  "command_type": "verify",
  "error_message": null
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `result` | required, string, in:`success`,`error` |
| `command_type` | required, string, in:`decommission`,`verify` |
| `error_message` | nullable, string, max:1000 |

**Transition rules (idempotency):**

| Current status | `command_type` | `result` | New status | Side effects |
|----------------|---------------|----------|------------|--------------|
| `pending` | `decommission` | `success` | `pending` | No status change; success on decommission command alone does not verify — verification command still required |
| `pending` | `decommission` | `error` | `failed` | `error_message` set |
| `pending` | `verify` | `success` | `completed` | `decommissioned_at = NOW()`, `node.status = 'decommissioned'` |
| `pending` | `verify` | `error` | `failed` | `error_message` set |
| `completed` | any | any | `completed` | No-op (`200` returned) |
| `manual` | any | any | — | `409 Conflict` — manual decommission cannot be overwritten by IoT ack |
| `failed` | any | any | `failed` | No-op (`200` returned) — already terminal |

**What the action does (`UpdateDecommissionStatusAction`):**

1. Looks up log by `id` — `404` if not found.
2. Validates `X-Internal-Token` header — `401` if missing or invalid.
3. Applies idempotency and guard rules above.
4. For `verify` + `success` transition:
   - Updates log: `status: completed`, `decommissioned_at: NOW()`
   - Updates `node.status = 'decommissioned'`
   - Wrapped in a DB transaction.
5. For `decommission`/`verify` + `error`:
   - Updates log: `status: failed`, `error_message` set.
6. Returns `200 OK` with updated `NodeDecommissionLogResource`.

**Success response:** `200 OK` — `NodeDecommissionLogResource` shape.

**Error responses:**

| HTTP | Condition |
|------|-----------|
| 401 | `X-Internal-Token` missing or invalid |
| 404 | Log entry not found |
| 409 | Log has `status = 'manual'` — IoT ack cannot overwrite manual decommission |

---

## Authorization Matrix

| Action | Superadmin | Role with `node_decommission.view` | Role with `node_decommission.decommission` | Role with `node_decommission.verify` | Role with `node_decommission.manual_decommission` |
|--------|------------|-----------------------------------|-------------------------------------------|--------------------------------------|--------------------------------------------------|
| View node list | ✅ | ✅ | — | — | — |
| View decommission history | ✅ | ✅ | — | — | — |
| Send decommission command | ✅ | — | ✅ | — | — |
| Resend decommission | ✅ | — | — | ✅ | — |
| Send verification command | ✅ | — | — | ✅ | — |
| Manual decommission | ✅ | — | — | — | ✅ |
| Internal ACK update | — (internal token only) | — | — | — | — |

**Network scoping:** Non-superadmin users may only query/act on nodes and logs in networks assigned to their role (`role_networks`).

---

## Frontend Specification

### Route

`/node-decommission` — standalone page. Registered in `AppRouter.tsx` as a lazy-loaded route.

**Route guard:** `FeatureRoute featureKey="node_decommission"` — users without the `node_decommission` feature in their role cannot reach this page (redirected to `/403`). Additionally, `canViewNodeDecommission()` is checked on page mount.

**This page is NOT nested under `/nodes`.** It has its own top-level route and sidebar entry.

---

### `useNodeDecommissionPermissions` Hook

Located at `src/hooks/useNodeDecommissionPermissions.ts`. Exposes named helpers — one per permission key.

```ts
canViewNodeDecommission()        → hasPermission('node_decommission.view')
canDecommissionNode()            → hasPermission('node_decommission.decommission')
canVerifyDecommission()          → hasPermission('node_decommission.verify')
canManualDecommission()          → hasPermission('node_decommission.manual_decommission')
```

---

### Views

#### Step 1 — Network Picker (inline on `/node-decommission`)

Before the node list is shown, the user must select a network.

- Rendered as a full-page or card-style picker (not a separate route).
- Network selector: a `<Select>` populated by `GET /api/v1/networks/options`.
- Non-superadmin: the options list is scoped to their `role_networks` (the API handles scoping; the frontend calls the same options endpoint).
- Once a network is selected, the node list and history tabs appear below.
- The selected `network_id` is held in page-level state and passed as a prop to both tabs.

**String constants:**
- `NODE_DECOMMISSION_STRINGS.SELECT_NETWORK_LABEL`
- `NODE_DECOMMISSION_STRINGS.SELECT_NETWORK_PLACEHOLDER`

---

#### Node List Tab

- Uses `DataTableServer` wrapped in `<div className="overflow-x-auto">`.
- Server-side pagination — calls `GET /api/v1/node-decommission/nodes?network_id={id}`.
- Search input filters by `search` param (node name, service ID) — debounced.
- Node type filter dropdown — calls `GET /api/v1/node-types/options` for the options list; sends `node_type_id` param.

**Table columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Node Name | `name` | — |
| Node Address | `node_address` | Uppercase hex |
| Service ID | `service_id` | — |
| Status | `status` badge | `new` → grey, `active` → green |
| Last Decommission Attempt | `latest_decommission_log.status` | Badge + relative time if exists; "—" if null |
| Actions | — | See below |

**Row actions (conditional on permissions):**

| Button | Condition | Permission |
|--------|-----------|------------|
| Decommission | `latest_decommission_log` is `null` OR status is `failed` or `completed` | `canDecommissionNode()` |
| Resend | `latest_decommission_log.status = 'failed'` AND `node.status !== 'decommissioned'` | `canVerifyDecommission()` |
| Verify | `latest_decommission_log.status = 'pending'` AND `latest_decommission_log.verification_timed_out` | `canVerifyDecommission()` |
| Manual | `latest_decommission_log.status = 'pending'` AND `latest_decommission_log.verification_timed_out` AND `node.status !== 'decommissioned'` | `canManualDecommission()` |

**Loading / empty / error states:**
- Loading: `DataTableServer` built-in skeleton rows.
- Empty: "No nodes available for decommissioning in this network." message.
- Error: `toast.error` with the API error message; table shows previous data or empty state.

---

#### History Tab

- Uses `DataTableServer` wrapped in `<div className="overflow-x-auto">`.
- Server-side pagination — calls `GET /api/v1/node-decommission/history?network_id={id}`.
- Status filter dropdown: All / Pending / Completed / Failed / Manual.
- Refresh button — refetches with a 5-second cooldown between clicks (same pattern as verify cooldown below).

**Table columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Node | `node.name` + `node.service_id` (sub-row) | — |
| Node Address | `node.node_address` | — |
| Initiated By | `initiated_by.name` | "—" if null |
| Status | `status` badge | `pending` → yellow, `completed` → green, `failed` → red, `manual` → blue |
| Verification Status | `verification_timed_out` + `verification_sent_at` | "Timed Out" badge if timed out; relative time if pending; "—" otherwise |
| Decommissioned At | `decommissioned_at` | ISO8601 formatted; "—" if null |
| Date | `created_at` | Relative time |

**Loading / empty / error states:** Same pattern as Node List tab.

---

#### Decommission Dialog (`NodeDecommissionDialog`)

Triggered by the "Decommission" row action button. Modal dialog.

**Props:** `node: DecommissionNode`, `open: boolean`, `onOpenChange`, `onSuccess`.

**Dialog structure:**

```tsx
<DialogContent className="w-full max-w-2xl max-h-[90vh] flex flex-col">
  <DialogHeader className="px-6 pt-6 pb-4 shrink-0">...</DialogHeader>
  <div className="overflow-y-auto flex-1 px-6 pb-2">
    { form fields }
  </div>
  <DialogFooter className="px-6 py-4 shrink-0 border-t">...</DialogFooter>
</DialogContent>
```

**Fields:** None — the payload is fixed (`"0e05446f697421"`) and generated server-side. The dialog is a confirmation modal only.

- Node name, address, and service ID shown as read-only info.
- Submit button: destructive style, disabled + spinner while submitting.
- On success: `toast.success`, dialog closes, node list row updates (`latest_decommission_log` reflects new pending status).
- On error: `toast.error`, dialog stays open.

**String constants:**
- `NODE_DECOMMISSION_STRINGS.DECOMMISSION_DIALOG_TITLE`
- `NODE_DECOMMISSION_STRINGS.DECOMMISSION_DIALOG_BODY`
- `NODE_DECOMMISSION_STRINGS.DECOMMISSION_SUBMIT_LABEL`

---

#### Verify Button (inline in table row — no dialog)

The "Verify" button is an inline action button in the node list row (no confirmation dialog). It calls `POST /api/v1/node-decommission/{node}/verify` directly.

- Button is disabled + shows spinner while the request is in-flight.
- **5-second cooldown after click:** the button remains disabled for 5 seconds after a successful call (frontend-only, tracked in local component state via `verifyLastClickedAt`). This prevents accidental rapid re-submission.
- On success: `toast.success("Verification sent. Expires in 2 minutes.")`, node list row refreshes.
- On error: `toast.error`, cooldown does NOT activate.

---

#### Manual Decommission Confirmation Dialog (`ManualDecommissionDialog`)

Triggered by the "Manual" row action button. Simple confirmation modal.

**Props:** `node: DecommissionNode`, `open: boolean`, `onOpenChange`, `onSuccess`.

- No form fields — confirmation only.
- Displays: "Are you sure you want to manually mark [node name] as decommissioned? No command will be sent to the IoT network."
- Confirm button: destructive style, disabled + spinner while submitting.
- Cancel button: closes dialog.
- On success: `toast.success`, dialog closes, node row removed from the list (node is now decommissioned and the list excludes decommissioned nodes).
- On error: `toast.error`.

**String constants:**
- `NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_TITLE`
- `NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_BODY`
- `NODE_DECOMMISSION_STRINGS.MANUAL_CONFIRM_SUBMIT`

---

### Data Fetching Strategy

- `network_id` is held in page-level state (`NodeDecommissionPage`), set when the user selects a network.
- The node list and history tabs are only rendered once a `network_id` is selected.
- `useNodeDecommissionNodes(networkId, params)` — wraps `GET /api/v1/node-decommission/nodes`. Lifts `network`, `nodeTypeOptions` fetches to the page level; passes as props to the tab.
- `useNodeDecommissionHistory(networkId, params)` — wraps `GET /api/v1/node-decommission/history`.
- Mutations (`decommission`, `resend`, `verify`, `manual`) are separate hook functions that invalidate/refetch the node list and history after success.
- `useNetworkOptions()` — called once at the page level for the network selector. Passes result as prop to the network picker component.
- `useNodeTypeOptions()` — called once at the page level (for the node list filter). Passes result as prop to the node list tab.

---

### TypeScript Types (`src/types/nodeDecommission.ts`)

```ts
export type NodeDecommissionLogStatus = 'pending' | 'completed' | 'failed' | 'manual';

export interface LatestDecommissionLog {
  id: number;
  status: NodeDecommissionLogStatus;
  is_manual: boolean;
  verification_timed_out: boolean;
  error_message: string | null;
  created_at: string;
}

export interface DecommissionNode {
  id: number;
  name: string;
  node_address: string;
  service_id: string;
  status: 'new' | 'active';
  network: { id: number; name: string; network_address: string };
  latest_decommission_log: LatestDecommissionLog | null;
}

export interface NodeDecommissionLog {
  id: number;
  node: { id: number; name: string; node_address: string; service_id: string; status: 'new' | 'active' | 'decommissioned' };
  network: { id: number; name: string; network_address: string };
  initiated_by: { id: number; name: string } | null;
  status: NodeDecommissionLogStatus;
  is_manual: boolean;
  command_id: number | null;
  verification_command_id: number | null;
  packet_id: string | null;
  payload: string | null;
  verification_packet_id: string | null;
  verification_sent_at: string | null;
  verification_expires_at: string | null;
  verification_timed_out: boolean;
  error_message: string | null;
  decommissioned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecommissionNodeListResponse {
  data: DecommissionNode[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { first: string; next: string | null; prev: string | null; last: string };
}

export interface NodeDecommissionHistoryResponse {
  data: NodeDecommissionLog[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { first: string; next: string | null; prev: string | null; last: string };
}

export interface DecommissionNodePayload {
  network_id: number;
}
```

---

### API File (`src/api/nodeDecommission.ts`)

```ts
import axiosClient from './axiosClient';
import type {
  DecommissionNodeListResponse,
  NodeDecommissionHistoryResponse,
  NodeDecommissionLog,
  DecommissionNodePayload,
} from '@/types/nodeDecommission';

export const getDecommissionNodes = async (params: {
  network_id: number;
  page?: number;
  per_page?: number;
  search?: string;
  node_type_id?: number;
}): Promise<DecommissionNodeListResponse> => {
  const res = await axiosClient.get('/v1/node-decommission/nodes', { params });
  return res.data;
};

export const getDecommissionHistory = async (params: {
  network_id: number;
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<NodeDecommissionHistoryResponse> => {
  const res = await axiosClient.get('/v1/node-decommission/history', { params });
  return res.data;
};

export const decommissionNode = async (
  nodeId: number,
  payload: DecommissionNodePayload
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/decommission`, payload);
  return res.data;
};

export const resendDecommission = async (
  nodeId: number
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/resend`);
  return res.data;
};

export const verifyDecommission = async (
  nodeId: number
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/verify`);
  return res.data;
};

export const manualDecommission = async (
  nodeId: number
): Promise<{ data: NodeDecommissionLog }> => {
  const res = await axiosClient.post(`/v1/node-decommission/${nodeId}/manual`);
  return res.data;
};
```

---

## Event & Async Flows

### Decommission Flow

```
Frontend → POST /api/v1/node-decommission/{node}/decommission
  → API creates Command + OutboxEvent + node_decommission_logs in ONE transaction
    (source_ep: 155, dest_ep: 146, type: send_data, payload: "0e05446f697421")
  → Outbox publisher → Redis Stream
  → IoT Dispatcher → publishes MQTT decommission command
  → Returns 201
```

### Verification Flow

```
Frontend → POST /api/v1/node-decommission/{node}/verify
  → API creates Command + OutboxEvent, updates node_decommission_logs in ONE transaction
    (source_ep: 5, dest_ep: 5, type: send_data, payload: "0501ff")
  → Outbox publisher → Redis Stream
  → IoT Dispatcher → publishes MQTT verification command
  → Returns 200

IoT Ack Listener → PATCH /api/v1/internal/node-decommission/{log}/status
  (command_type: verify, result: success|error)
  → API updates log: status = completed, node.status = decommissioned
```

### Resend Flow

```
Frontend → POST /api/v1/node-decommission/{node}/resend
  → API creates Command + OutboxEvent, updates node_decommission_logs in ONE transaction
    (source_ep: 155, dest_ep: 146, same payload as original decommission)
  → Outbox publisher → Redis Stream
  → IoT Dispatcher → publishes MQTT decommission command
  → Returns 200
```

---

## Business Rules

1. **Nodes are never deleted.** Decommissioning updates `node.status = 'decommissioned'` in-place.
2. **Decommissioned nodes are excluded from the node list.** `GET /api/v1/node-decommission/nodes` never returns nodes with `status = 'decommissioned'`.
3. **No duplicate active decommissions.** A `POST /decommission` returns `409` if the node already has a `pending` log entry.
4. **Resend requires failed status.** `POST /resend` only valid when the most recent log entry is `failed`.
5. **Verify requires pending status.** `POST /verify` only valid when the most recent log entry is `pending`.
6. **Verification expiry is enforced at read time.** When `verification_expires_at` is in the past and `status = 'pending'`, the `verification_timed_out` computed attribute is `true`. The status is NOT automatically changed to `failed` — only the IoT ACK endpoint changes status.
7. **Manual decommission is immediate.** `POST /manual` transitions the node to `decommissioned` and creates the log entry in a single transaction; no IoT command is sent.
8. **Log entries are permanent.** `node_decommission_logs` records are never deleted.
9. **Network scoping for non-superadmins.** All node and history queries are restricted to the user's `role_networks`.
10. **Payload stored as lowercase hex.** The `payload` field is normalised to lowercase on write.
11. **`packet_id` generation is sequential.** A single shared counter across both `packet_id` and `verification_packet_id` columns guarantees global uniqueness. The counter is derived from `MAX()` of both columns at generation time. IDs are zero-padded 4-char hex strings (`"0001"`, `"000f"`, `"0100"`). Exhaustion at `0xFFFF` throws a `RuntimeException`.

---

## Out of Scope

- **IoT dispatch pipeline for manual decommission.** Manual decommission (`POST /manual`) does not send any IoT command — it only updates the database. All other actions (decommission, verify, resend) DO dispatch via the outbox → Redis Streams → MQTT pipeline.
- **Bulk decommission.** Only one node can be decommissioned at a time in this spec.
- **Reprovisioning flow.** Nodes can be reprovisioned after decommissioning (the status can be reset), but the provisioning module manages that flow.
- **Automated timeout processing.** No scheduled job automatically transitions timed-out verifications to `failed` — this is a future enhancement. The `verification_timed_out` flag is computed at read time only.
- **Email/notification on decommission.** No alerts or notifications are sent.
- **Export of decommission history.** CSV or similar export is not included.
- **Decommission approval flow.** No two-step approval or countersign requirement.

---

## Open Questions

1. **Decommission payload format.** The spec assumes the user supplies the `payload` field (e.g. `"0501ff"`) in the decommission dialog. Should the API auto-generate a canonical decommission payload, or is the user-supplied payload the correct approach for the old system's protocol?
2. **Verification payload construction.** The spec defines the verification payload as `{log.packet_id}0501ff`. Confirm this is the correct format for the legacy IoT protocol.
3. **Feature key name.** The spec uses `node_decommission` as the feature key for the sidebar/route guard. Confirm this matches the intended feature seed value.
4. **Role assignment.** Which system roles (e.g. Platform Admin, Platform Support) should receive `node_decommission.*` permission keys in the seeder? This needs product input.
5. **Node type filter join.** The `GET /api/v1/node-decommission/nodes` filter by `node_type_id` requires a join on `network_node_types` (which links networks to node types, not nodes directly). Confirm whether node type filtering should be dropped for v1 or if the `nodes` table will eventually gain a direct `node_type_id` FK.

---

## Checklist Before Implementation

### API

- [ ] Migration: add `status` column to `nodes` table (modify `0001_01_01_000014_create_nodes_table.php`)
- [ ] Migration: `node_decommission_logs` table (new file: `2026_04_08_000001_create_node_decommission_logs_table.php`)
- [ ] `NodeDecommissionLog` model + relationships (`node`, `network`, `initiatedBy`)
- [ ] `NodeDecommissionLogStatus` PHP enum (`pending`, `completed`, `failed`, `manual`)
- [ ] `NodeStatus` PHP enum — confirm or add `decommissioned` value (may already exist from Provisioning module)
- [ ] `NodeDecommissionLogResource` — full shape
- [ ] `DecommissionNodeResource` — list item shape (includes `latest_decommission_log`)
- [ ] `DecommissionNodeAction` + `DecommissionNodeDTO`
- [ ] `ResendDecommissionAction`
- [ ] `VerifyDecommissionAction`
- [ ] `ManualDecommissionAction`
- [ ] `UpdateDecommissionStatusAction`
- [ ] `GenerateDecommissionPacketIdAction`
- [ ] `NodeDecommissionController` (index, history, decommission, resend, verify, manual, internalStatus)
- [ ] `DecommissionNodeRequest`, `VerifyDecommissionRequest`, `UpdateDecommissionStatusRequest`
- [ ] `NodeDecommissionPolicy` (decommission, verify, manualDecommission)
- [ ] Routes in `routes/api.php` (public + internal)
- [ ] `PermissionSeeder.php` — add 4 new entries under `module = 'node_decommission'`
- [ ] Feature tests: happy path decommission, 409 on duplicate pending, verify, verify timeout flag, manual (pending log set to failed), resend, internal ACK success (→ completed), internal ACK error (→ failed), 403 for missing permissions, network scoping for non-superadmin

### Frontend

- [ ] `src/types/nodeDecommission.ts`
- [ ] `src/api/nodeDecommission.ts`
- [ ] `src/hooks/useNodeDecommissionPermissions.ts`
- [ ] `src/hooks/useNodeDecommission.ts` (node list + history)
- [ ] `src/pages/node-decommission/NodeDecommissionPage.tsx` (network picker + tabs)
- [ ] `src/components/shared/NodeDecommissionDialog.tsx`
- [ ] `src/components/shared/ManualDecommissionDialog.tsx`
- [ ] Routes in `AppRouter.tsx` (lazy loaded, `FeatureRoute featureKey="node_decommission"`)
- [ ] Sidebar entry under appropriate nav group
- [ ] All strings in `src/constants/strings.ts` under `NODE_DECOMMISSION_STRINGS`
- [ ] Dark mode variants on all custom styles

---

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| v0.2 | 2026-04-08 | Post-implementation alignment: `verified` → `completed`; dispatch pipeline implemented; packet IDs sequential not random; decommission payload fixed server-side; manual decommission sets existing pending log to `failed`; `command_id`/`verification_command_id` added to data model and response shapes; `node.status` added to history log response; endpoint/button visibility logic updated |
| v0.1 | 2026-04-08 | Initial draft |
